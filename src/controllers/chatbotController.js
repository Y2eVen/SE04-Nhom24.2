require("dotenv").config();
import request from "request";

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect();

// pool.query("DROP TABLE IF EXISTS test_table; CREATE table test_table (id serial PRIMARY KEY, Tên text, Đại_diện text, SĐT text, Email text, LinkFB text, Yêu_cầu_hỗ_trợ text, Hình_thức_cứu_trợ text, Đối_tượng_ưu_tiên text, Chia_sẻ text, Đề_xuất_khác text); Insert into test_table( Tên, Đại_diện , SĐT, Email, LinkFB, Yêu_cầu_hỗ_trợ, Hình_thức_cứu_trợ, Đối_tượng_ưu_tiên, Chia_sẻ, Đề_xuất_khác) values ( 'Nguyễn Khắc Bấc', 'Cá nhân', '0485458945', 'bug@gmail.com','tranducbo88.com' , '1010100' , '10010100', '10101010', '10100', '0');", (err, res) => {
//   if (err) throw err;
// });

function insertForm(arr) {
  var ten = arr[0];
  var daiDien = arr[1];
  var sdt = arr[2];
  var email = arr[3]
  var link = arr[4]
  var yeucauHoTro = arr[5].concat(arr[6], arr[7], arr[8], arr[9], arr[10])
  var hinhThucCuuTro = arr[11].concat(arr[12], arr[13], arr[14])
  var doiTuongUuTien = arr[15].concat(arr[16], arr[17], arr[18], arr[19], arr[21], arr[22], arr[23], arr[24], arr[25], arr[26])
  var chiaSe = arr[27].concat(arr[28], arr[29])
  var deXuatKhac = arr[30]
  var queryString = `Insert into test_table( Tên, Đại_diện , SĐT, Email, LinkFB, Yêu_cầu_hỗ_trợ, Hình_thức_cứu_trợ, Đối_tượng_ưu_tiên, Chia_sẻ, Đề_xuất_khác) values ( '${ten}' , '${daiDien}', '${sdt}', '${email}', '${link}', '${yeucauHoTro}' , '${hinhThucCuuTro}', '${doiTuongUuTien}', '${chiaSe}', '${deXuatKhac}');`;

  pool.query(queryString, (err, res) => {
    if (err) throw err;
  });
}

let getDb = async (req, res) => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT * FROM test_table');
    const results = { 'results:': (result) ? result.rows : null }
    res.send(JSON.stringify(results))
    client.release();
  } catch (err) {
    console.log(err)
    res.send("Error " + err)
  }
}

let getHomepage = (req, res) => {
  return res.render("homepage.ejs");
}

let getWebhook = (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
}

let postWebhook = (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {


      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message && sender_psid != 100730141849563) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

const { spawn } = require('child_process');

var delayedTime = 3000

var allCurUserResponse = {};

var regexPhoneNum = /[\+]?[(]?[8]?[4]?[0-9]{2}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{5}/im;
var regexEmail = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/im;
var regexNum = /\d+/;

var allUserAns = {};

var askPhoneNumQs = {
  1: 'Số điện thoại của Anh/Chị là gì ạ?',
  2: 'Tôi có thể liên lạc với Anh/Chị qua số điện thoại là gì nhỉ?',
  3: 'Vui lòng cho biết Số điện thoại của Anh/Chị?',
}

var askOtherOrgQs = {
  1: 'Vậy đơn vị/bộ phận mà Anh/Chị đang đại diện là gì?',
  2: 'Anh/Chị đang đại diện cho đơn vị/bộ phận nào?',
}

var askOrgQs = {
  1: 'Tên tổ chức Anh/Chị đang đại diện là gì?',
  2: 'Anh/Chị đang đại diện cho tổ chức nào?',
}

var askNameQs = {
  1: 'Vui lòng cho tôi biết tên đầy đủ của Anh/Chị?',
  2: 'Tôi có thể gọi Anh/Chị là gì nhỉ?',
  3: 'Tên đầy đủ của Anh/Chị là gì nhỉ?',
  4: 'Tôi tên là Đa, còn Anh/Chị là?',
  5: 'Mọi người thường gọi Anh/Chị là gì?',
  6: 'Tôi có thể biết tên của Anh/Chị không?',
  7: 'Tôi có thể biết tôi đang nói chuyện với ai được không?',
}

function modifyResponse(fileName, data, sender_psid) {
  let childPython = spawn('python', [fileName, data]);
  childPython.stdout.on('data', function (data) {

    // var obj = JSON.parse(`${data}`);
    // console.log(obj.nerLabel);  
    allCurUserResponse[sender_psid] = {
      "text": `${data}`
    }

  });
  childPython.stderr.on('data', (data) => {
    console.error(`${data}`);
  });

  childPython.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  });
}

modifyResponse('getName.py', "h", 1209302);

function sendGreeting(sender_psid) {
  let rsp_1;
  let rsp_2;
  rsp_2 = { "text": "Chào Anh/Chị!\nTôi là trợ lý của Tổ Thông tin đáp ứng nhanh cứu trợ thiên tai\n- Đội tình nguyện kêu gọi các tổ chức, cá nhân đã, đang và có mong muốn tham gia cứu trợ, trợ giúp đồng bào vùng lũ lụt hãy tham gia cập nhật thông tin trên hệ thống để hệ thống quay lại trợ giúp hoạt động cứu trợ hiệu quả hơn." }
  rsp_1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Anh/Chị muốn cứu trợ miền Trung phải không?",
          "subtitle": "Anh/Chị có thể chọn nút ở bên dưới để trả lời",
          "buttons": [
            {
              "type": "postback",
              "title": "Đúng vậy",
              "payload": "dungvay",
            },
            {
              "type": "postback",
              "title": "Không phải",
              "payload": "khongphai",
            }
          ],
        }]
      }
    }
  }

  // Sends the response message
  callSendAPI(sender_psid, rsp_2);
  setTimeout(function () {
    callSendAPI(sender_psid, rsp_1);
  }, 500);
}

function getYNTemplate(tittle, payload1, payload2) {
  let response = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": tittle,
          "subtitle": "Anh/Chị có thể chọn nút ở bên dưới để trả lời",
          "buttons": [
            {
              "type": "postback",
              "title": "Có",
              "payload": payload1,
            },
            {
              "type": "postback",
              "title": "Không",
              "payload": payload2,
            },
          ],
        }]
      }
    }
  }

  return response;
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
  console.log(allUserAns[sender_psid]);
  let response;

  // Check if the message contains text
  if (received_message.text) {
    // example: received_message.nlp.intents[0] = 
    // { id: '179680580557548', name: 'greeting', confidence: 0.8498 }
    let objIntent = received_message.nlp.intents;

    let intentName = ''
    let intentConf = 0
    if (objIntent[0]) {
      intentName = objIntent[0].name;
      intentConf = objIntent[0].confidence;
    }
    
    if (intentName == 'greeting' && intentConf >= 0.8) {
      sendGreeting(sender_psid);
      allUserAns[sender_psid] = [];
    } else if (allUserAns[sender_psid] != null) {
        if (!allUserAns[sender_psid][0] && intentName == 'yes' && intentConf >= 0.8) {
        allUserAns[sender_psid] = [1];
        let randNum = Math.floor(Math.random() * Object.keys(askNameQs).length) + 1;
        let txt = askNameQs[randNum];
        response = { "text": txt }
      } else if (allUserAns[sender_psid][0] == 1) {
        allCurUserResponse[sender_psid] = {};
        modifyResponse('getName.py', received_message.text, sender_psid);
        setTimeout(() => {
          if (allCurUserResponse[sender_psid].text != "") {
            allUserAns[sender_psid][0] = allCurUserResponse[sender_psid].text;
            response = {
              "attachment": {
                "type": "template",
                "payload": {
                  "template_type": "generic",
                  "elements": [{
                    "title": "Anh/ Chị muốn ủng hộ theo cá nhân hay tổ chức?",
                    "subtitle": "Anh/Chị có thể chọn nút ở bên dưới để trả lời",
                    "buttons": [
                      {
                        "type": "postback",
                        "title": "Cá nhân",
                        "payload": "canhan",
                      },
                      {
                        "type": "postback",
                        "title": "Tổ chức",
                        "payload": "tochuc",
                      },
                      {
                        "type": "postback",
                        "title": "Khác",
                        "payload": "donvikhac",
                      }
                    ],
                  }]
                }
              }
            }
          } else {
            let randNum = Math.floor(Math.random() * Object.keys(askNameQs).length) + 1;
            let txt = askNameQs[randNum];
            response = { "text": txt };
          }
        }, delayedTime);
      }
      else if (!allUserAns[sender_psid][1]) {
        if (intentName == 'ca_nhan' && intentConf >= 0.8) {
          allUserAns[sender_psid][1] = "Cá nhân";
          let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
          let txt = askPhoneNumQs[randNum];
          response = { "text": txt };
        } else if (intentName == 'to_chuc' && intentConf >= 0.8) {
          allUserAns[sender_psid][1] = "Tổ chức";
          let randNum = Math.floor(Math.random() * Object.keys(askOrgQs).length) + 1;
          let txt = askOrgQs[randNum];
          response = { "text": txt };
        } else if (intentName == 'khac' && intentConf >= 0.8) {
          allUserAns[sender_psid][1] = "Khác";
          let randNum = Math.floor(Math.random() * Object.keys(askOtherOrgQs).length) + 1;
          let txt = askOtherOrgQs[randNum];
          response = { "text": txt };
        }
      }
      else if (allUserAns[sender_psid][1] === 'Tổ chức') {
        let objEntity = Object.values(received_message.nlp.entities)[0][0];
        if (objEntity && objEntity.name == 'org_name') {
          allUserAns[sender_psid][1] = objEntity.value;
          let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
          let txt = askPhoneNumQs[randNum];
          response = { "text": txt };
        } else {
          let randNum = Math.floor(Math.random() * Object.keys(askOrgQs).length) + 1;
          let txt = askOrgQs[randNum];
          response = { "text": txt };
        }
      }
      else if (allUserAns[sender_psid][1] === 'Khác') {
        allUserAns[sender_psid][1] = received_message.text;
        let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
        let txt = askPhoneNumQs[randNum];
        response = { "text": txt };
      }
      else if (!allUserAns[sender_psid][2]) {
        let phoneNum = received_message.text.match(regexPhoneNum);
        let num = received_message.text.match(regexNum);
        if (phoneNum && num[0].length <= 12 && num[0].length >= 10) {
          allUserAns[sender_psid][2] = phoneNum[0];
          response = { "text": 'Email để liên lạc của Anh/Chị là gì nhỉ?' };
        } else {
          let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
          let txt = askPhoneNumQs[randNum];
          response = { "text": txt };
        }
      } else if (!allUserAns[sender_psid][3]) {
        let email = received_message.text.match(regexEmail);
        if (email) {
          allUserAns[sender_psid].push(received_message.text);
          response = { "text": 'Đường link đến Facebook của Anh/Chị là gì nhỉ?\nNếu Anh/Chị dùng phương thức khác thì hãy cho tôi biết tên phương thức và tên tài khoản tương ứng.' };
        } else {
          response = { "text": 'Email để liên lạc của Anh/Chị là gì nhỉ?' };
        }
      } else if (!allUserAns[sender_psid][4]) {
        let objEntity = Object.values(received_message.nlp.entities);
        if (objEntity && objEntity[0][0].name == 'wit$url') {
          allUserAns[sender_psid].push(objEntity[0][0].value);
          response = { "text": 'Anh/ Chị có cần hỗ trợ thông tin về địa phương chịu thiệt hại nhất, chưa được hỗ trợ nhiều không ạ?' };
        } else {
          response = { "text": 'Đường link đến Facebook của Anh/Chị là gì nhỉ?\nNếu Anh/Chị dùng phương thức khác thì hãy cho tôi biết tên phương thức và tên tài khoản tương ứng.' };
        }
      } else if (allUserAns[sender_psid][5] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][5] = 'Thông tin về địa phương \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][5] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/ Chị có muốn tôi cung cấp thông tin về danh sách các hoàn cảnh bị thiệt hại và cần được hỗ trợ xác minh các trường hợp này không?' };
        } else {
          response = { "text": 'Anh/ Chị có cần hỗ trợ thông tin về địa phương chịu thiệt hại nhất, chưa được hỗ trợ nhiều không ạ?' };
        }
      } else if (allUserAns[sender_psid][6] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][6] = 'Thông tin về các hoàn cảnh \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][6] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/ Chị có nhu cầu kết nối với chính quyền và các tổ chức tại địa phương không ạ?' };
        } else {
          response = { "text": 'Anh/ Chị có muốn tôi cung cấp thông tin về danh sách các hoàn cảnh bị thiệt hại và cần được hỗ trợ xác minh các trường hợp này không?' };
        }
      } else if (allUserAns[sender_psid][7] == null){
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][7] = 'Kết nối với chính quyền \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][7] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/ Chị có muốn kết nối với tình nguyện viên/ tổ chức từ thiện khác ở cùng khu vực không ạ?' };
        } else {
          response = { "text": 'Anh/ Chị có nhu cầu kết nối với chính quyền và các tổ chức tại địa phương không ạ?' };
        }
      } else if (allUserAns[sender_psid][8] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][8] = 'Kết nối với tổ chức khác \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][8] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/ Chị có cần hỗ trợ chuyển tiền, hàng cứu trợ đến tận tay người được cứu trợ không ạ?' };
        } else {
          response = { "text": 'Anh/ Chị có muốn kết nối với tình nguyện viên/ tổ chức từ thiện khác ở cùng khu vực không ạ?' };
        }
      } else if (allUserAns[sender_psid][9] == null){
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][9] = 'Chuyển cứu trợ \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][9] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/ Chị có muốn huy động được nhiều nguồn lực hơn bằng truyền thông không ạ?' };
        } else {
          response = { "text": 'Anh/ Chị có cần hỗ trợ chuyển tiền, hàng cứu trợ đến tận tay người được cứu trợ không ạ?' };
        }
      } else if (allUserAns[sender_psid][10] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][10] = 'Nguồn lực \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][10] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Về hình thức cứu trợ, Anh/Chị có nhu cầu Gửi tiền không ạ?' };
        } else {
          response = { "text": 'Anh/ Chị có muốn huy động được nhiều nguồn lực hơn bằng truyền thông không ạ?' };
        }
      } else if (allUserAns[sender_psid][11] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][11] = 'Gửi tiền \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][11] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Vậy còn Gửi hàng có phải 1 trong những hình thức cứu trợ mà Anh/Chị đang quan tâm không ạ?' };
        } else {
          response = { "text": 'Về hình thức cứu trợ, Anh/Chị có nhu cầu Gửi tiền không ạ?' };
        }
      } else if (allUserAns[sender_psid][12] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][12] = 'Gửi hàng \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][12] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có đang quan tâm đến hình thức cứu trợ Hỗ trợ lâu dài không ạ?' };
        } else {
          response = { "text": 'Vậy còn Gửi hàng có phải 1 trong những hình thức cứu trợ mà Anh/Chị đang quan tâm không ạ?' };
        }
      } else if (allUserAns[sender_psid][13] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][13] = 'Hỗ trợ lâu dài \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][13] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có muốn cứu trợ bằng hình thức khác bên trên không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có đang quan tâm đến hình thức cứu trợ Hỗ trợ lâu dài không ạ?' };
        }
      } else if (allUserAns[sender_psid][14] == null){                    
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][14] = '1';
          response = { "text": 'Vậy hình thức đó là gì ạ?' };
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][14] = '';
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Bất cứ ai có hoàn cảnh khó khăn không ạ?' };
        } else {
          allUserAns[sender_psid][14] = received_message.text.concat('\n');
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Bất cứ ai có hoàn cảnh khó khăn không ạ?' };
        }
      } else if (allUserAns[sender_psid][14] === '1') {
        allUserAns[sender_psid][14] = received_message.text.concat('\n');
        response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Bất cứ ai có hoàn cảnh khó khăn không ạ?' };
      } else if (allUserAns[sender_psid][15] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][15] = 'Hoàn cảnh khó khăn \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][15] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có ưu tiên giúp đỡ Người già không ạ?' };
        } else {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Bất cứ ai có hoàn cảnh khó khăn không ạ?' };
        }
      } else if (allUserAns[sender_psid][16] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][16] = 'Người già \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][16] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Người bệnh có nằm trong danh sách đối tượng ưu tiên của Anh/Chị không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có ưu tiên giúp đỡ Người già không ạ?' };
        } 
      } else if (allUserAns[sender_psid][17] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][17] = 'Người bệnh \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][17] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có bao gồm Trẻ em không ạ?' };
        } else {
          response = { "text": 'Người bệnh có nằm trong danh sách đối tượng ưu tiên của Anh/Chị không ạ?' };
        } 
      } else if (allUserAns[sender_psid][18] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][18] = 'Trẻ em \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][18] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Nông dân không ạ?' };
        } else {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có bao gồm Trẻ em không ạ?' };
        }
      } else if (allUserAns[sender_psid][19] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][19] = 'Nông dân \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][19] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Ngư dân có nằm trong danh sách đối tượng ưu tiên của Anh/Chị không ạ?' };
        } else {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Nông dân không ạ?' };
        }
      } else if (allUserAns[sender_psid][20] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][20] = 'Ngư dân \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][20] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Trường học không ạ?' };
        } else {
          response = { "text": 'Ngư dân có nằm trong danh sách đối tượng ưu tiên của Anh/Chị không ạ?' };
        }
      } else if (allUserAns[sender_psid][21] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][21] = 'Trường học \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][21] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có bao gồm Cơ sở Y tế không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Trường học không ạ?' };
        }
      } else if (allUserAns[sender_psid][22] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][22] = 'Cơ sở y tế \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][22] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Xây dựng hạ tầng (điện đường trường trạm) không ạ?' };
        } else {
          response = { "text": 'Đối tượng Anh/Chị ưu tiên có bao gồm Cơ sở Y tế không ạ?' };
        }
      } else if (allUserAns[sender_psid][23] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][23] = 'Xây dựng hạ tầng \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][23] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Cung cấp nước sạch, vệ sinh sạch không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Xây dựng hạ tầng (điện đường trường trạm) không ạ?' };
        }
      } else if (allUserAns[sender_psid][24] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][24] = 'Nước sạch \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][24] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Cung cấp nhà an toàn trong lũ không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Cung cấp nước sạch, vệ sinh sạch không ạ?' };
        }
      } else if (allUserAns[sender_psid][25] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][25] = 'Nhà an toàn \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][25] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Có đối tượng khác ngoài các đối tượng bên trên mà Anh/Chị cũng muốn ưu tiên không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Cung cấp nhà an toàn trong lũ không ạ?' };
        }
      } else if (allUserAns[sender_psid][26] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][26] = '1';
          response = { "text": 'Vậy đối tượng đó là ai ạ?' };
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][26] = '';
          response = { "text": 'Anh/Chị có muốn chia sẻ Các dữ liệu các hoàn cảnh / hộ cần cứu trợ mà mình có không ạ?' };
        } else {
          allUserAns[sender_psid][26] = received_message.text.concat('\n');
          response = { "text": 'Anh/Chị có muốn chia sẻ Các dữ liệu các hoàn cảnh / hộ cần cứu trợ mà mình có không ạ?' };
        }
      } else if (allUserAns[sender_psid][26] === '1') {
        allUserAns[sender_psid][26] = received_message.text.concat('\n');
        response = { "text": 'Anh/Chị có muốn chia sẻ Các dữ liệu các hoàn cảnh / hộ cần cứu trợ mà mình có không ạ?' };
      } else if (allUserAns[sender_psid][27] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][27] = 'Các hoàn cảnh \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][27] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Sau khi cứu trợ, Anh/Chị có muốn chia sẻ hình ảnh và thông tin đã cứu trợ với chúng tôi không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có muốn chia sẻ Các dữ liệu các hoàn cảnh / hộ cần cứu trợ mà mình có không ạ?' };
        }
      } else if (allUserAns[sender_psid][28] == null){ 
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][28] = 'Hình ảnh cứu trợ \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][28] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có muốn chia sẻ với chúng tôi bằng cách Tham gia tình nguyện viên cùng chiến dịch không ạ?' };
        } else {
          response = { "text": 'Sau khi cứu trợ, Anh/Chị có muốn chia sẻ hình ảnh và thông tin đã cứu trợ với chúng tôi không ạ?' };
        }
      } else if (allUserAns[sender_psid][29] == null){     
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][29] = 'Tham gia tình nguyện viên \n';
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][29] = '';
        }
        if (intentConf >= 0.8) {
          response = { "text": 'Anh/Chị có Ý tưởng, Đề xuất khác muốn chia sẻ với cộng đồng không ạ?' };
        } else {
          response = { "text": 'Anh/Chị có muốn chia sẻ với chúng tôi bằng cách Tham gia tình nguyện viên cùng chiến dịch không ạ?' };
        }
      } else if (allUserAns[sender_psid][30] == null){  
        if (intentName == 'yes' && intentConf >= 0.8) {
          allUserAns[sender_psid][30] = '1';
          response = { "text": 'Vậy Anh/Chị muốn chia sẻ ý tưởng, đề xuất điều gì ạ?' };
        } else if (intentName == 'no' && intentConf >= 0.8) {
          allUserAns[sender_psid][30] = '';
          response = { "text": 'Việc thu thập thông tin này được thực hiện trong khuôn khổ Chiến dịch xã hội “Hỗ trợ người cứu trợ - Hướng về khúc ruột miền Trung”, được phát động bởi Đội tình nguyện viên Hỗ trợ điều phối thông tin cứu trợ.\n\nThông tin và yêu cầu của Anh/Chị đã được ghi nhận. Xin chân thành cảm ơn Anh/Chị đã dành thời gian trả lời ^^!' };
          insertForm(allUserAns[sender_psid]);
          allUserAns[sender_psid] = null;
        } else {
          allUserAns[sender_psid][30] = received_message.text.concat('\n');
          response = { "text": 'Việc thu thập thông tin này được thực hiện trong khuôn khổ Chiến dịch xã hội “Hỗ trợ người cứu trợ - Hướng về khúc ruột miền Trung”, được phát động bởi Đội tình nguyện viên Hỗ trợ điều phối thông tin cứu trợ.\n\nThông tin và yêu cầu của Anh/Chị đã được ghi nhận. Xin chân thành cảm ơn Anh/Chị đã dành thời gian trả lời ^^!' };
          insertForm(allUserAns[sender_psid]);
          allUserAns[sender_psid] = null;
        }
      } else if (allUserAns[sender_psid][30] === '1') {
        allUserAns[sender_psid][30] = received_message.text.concat('\n');
        response = { "text": 'Việc thu thập thông tin này được thực hiện trong khuôn khổ Chiến dịch xã hội “Hỗ trợ người cứu trợ - Hướng về khúc ruột miền Trung”, được phát động bởi Đội tình nguyện viên Hỗ trợ điều phối thông tin cứu trợ.\n\nThông tin và yêu cầu của Anh/Chị đã được ghi nhận. Xin chân thành cảm ơn Anh/Chị đã dành thời gian trả lời ^^!' };
        insertForm(allUserAns[sender_psid]);
        allUserAns[sender_psid] = null;
      }
      else if (!allUserAns[sender_psid][31]) {
        response = { "text": `Amazing Gút Chóp Anh/Chị!!!` };
      }
    }
  }

  setTimeout(() => {
    callSendAPI(sender_psid, response);
  }, delayedTime);

}


// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another pig." }
  } else if (payload === 'dungvay') {
    allUserAns[sender_psid] = [1];
    let randNum = Math.floor(Math.random() * Object.keys(askNameQs).length) + 1;
    let txt = askNameQs[randNum];
    response = { "text": txt }
  } else if (payload === 'canhan') {
    allUserAns[sender_psid][1] = "Cá nhân";
    let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
    let txt = askPhoneNumQs[randNum];
    response = { "text": txt };
  } else if (payload === 'tochuc') {
    allUserAns[sender_psid][1] = "Tổ chức";
    let randNum = Math.floor(Math.random() * Object.keys(askOrgQs).length) + 1;
    let txt = askOrgQs[randNum];
    response = { "text": txt };
  } else if (payload === 'donvikhac') {
    allUserAns[sender_psid][1] = "Khác";
    let randNum = Math.floor(Math.random() * Object.keys(askOtherOrgQs).length) + 1;
    let txt = askOtherOrgQs[randNum];
    response = { "text": txt };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v7.0/me/messages",
    "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

module.exports = {
  getHomepage: getHomepage,
  getWebhook: getWebhook,
  postWebhook: postWebhook,
  getDb: getDb,
}
