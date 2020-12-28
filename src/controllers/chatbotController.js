require("dotenv").config();
import request from "request";

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

var curUserResponse = {
  "text" : ""
};
 
var regexPhoneNum = /[\+]?[(]?[8]?[4]?[0-9]{2}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/im;
var regexEmail = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/im;

var ansArr = []

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

function modifyResponse(fileName,data) {
  let childPython = spawn('python', [fileName, data]);
        childPython.stdout.on('data', function(data) {
          
          // var obj = JSON.parse(`${data}`);
          // console.log(obj.nerLabel);  
          curUserResponse = {
            "text" : `${data}` 
          }
        
        });
        childPython.stderr.on('data', (data) => {
            console.error(`${data}`);
        });

        childPython.on('close', (code) => {
            console.log(`child process exited with code ${code}`)
        });
}

modifyResponse('getName.py', "h");

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
    setTimeout(function() {
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
  
  let response ;
    
    // Check if the message contains text
    if (received_message.text) {
      // example: received_message.nlp.intents[0] = 
      // { id: '179680580557548', name: 'greeting', confidence: 0.7498 }
      let objIntent = received_message.nlp.intents[0];
    
      let intentName = ''
      let intentConf = 0
      if (objIntent) {
        intentName = objIntent.name
        intentConf = objIntent.confidence
      }
      
      if (intentName == 'greeting' && intentConf >= 0.7) {
        sendGreeting(sender_psid);
      } else if (!ansArr[0] && intentName == 'yes' && intentConf >= 0.7) {
        ansArr[0] = 1;
        let randNum = Math.floor(Math.random() * Object.keys(askNameQs).length) + 1;
        let txt = askNameQs[randNum];
        response = { "text": txt }
      } else if (ansArr[0] == 1) {
        modifyResponse('getName.py', received_message.text);
        setTimeout(() => {
          if (curUserResponse.text != "") {
            ansArr[0] = curUserResponse.text;
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
      else if (!ansArr[1]) {
        if (intentName == 'ca_nhan' && intentConf >= 0.7) {
          ansArr[1] = "Cá nhân";
          let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
          let txt = askPhoneNumQs[randNum];
          response = { "text": txt };
        } else if (intentName == 'to_chuc' && intentConf >= 0.7) {
          ansArr[1] = "Tổ chức";
          let randNum = Math.floor(Math.random() * Object.keys(askOrgQs).length) + 1;
          let txt = askOrgQs[randNum];
          response = { "text": txt };
        } else if (intentName == 'khac' && intentConf >= 0.7) {
          ansArr[1] = "Khác";
          let randNum = Math.floor(Math.random() * Object.keys(askOtherOrgQs).length) + 1;
          let txt = askOtherOrgQs[randNum];
          response = { "text": txt };
        } 
      }
      else if (ansArr[1] === 'Tổ chức') {
        // cần nhận diện tên tổ chức ở đây
        ansArr[1] = received_message.text;
        let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
        let txt = askPhoneNumQs[randNum];
        response = { "text": txt };
      }
      else if (ansArr[1] === 'Khác') {
        ansArr[1] = received_message.text;
        let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
        let txt = askPhoneNumQs[randNum];
        response = { "text": txt };
      }
      else if (!ansArr[2]){ 
        let phoneNum = received_message.text.match(regexPhoneNum);
        if (phoneNum) {
          ansArr[2] = phoneNum[0]; 
          response = { "text": 'Email để liên lạc của Anh/Chị là gì nhỉ?' };
        } else {
          let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
          let txt = askPhoneNumQs[randNum];
          response = { "text": txt };
        }
      } else if (!ansArr[3]) { 
        let email = received_message.text.match(regexEmail);
        if (email) {
          ansArr.push(received_message.text); 
          response = { "text": 'Đường link đến Facebook của Anh/Chị là gì nhỉ?\nNếu Anh/Chị dùng phương thức khác thì hãy cho tôi biết tên phương thức và tên tài khoản tương ứng.' };
        } else {
          response = { "text": 'Email để liên lạc của Anh/Chị là gì nhỉ?' };
        }
      } else if (!ansArr[4]) {
        let objEntity = Object.values(received_message.nlp.entities)[0];
        if (objEntity && objEntity[0].name == 'wit$url') {
          ansArr.push(objEntity[0].value);
          response = { "text": 'Anh/ Chị có cần hỗ trợ thông tin về địa phương chịu thiệt hại nhất, chưa được hỗ trợ nhiều không ạ?' };  
        } else {
          response = { "text": 'Đường link đến Facebook của Anh/Chị là gì nhỉ?\nNếu Anh/Chị dùng phương thức khác thì hãy cho tôi biết tên phương thức và tên tài khoản tương ứng.' };
        }
      } else if (!ansArr[5]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/ Chị có muốn tôi cung cấp thông tin về danh sách các hoàn cảnh bị thiệt hại và cần được hỗ trợ xác minh các trường hợp này không?' };
    } else if (!ansArr[6]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/ Chị có nhu cầu kết nối với chính quyền và các tổ chức tại địa phương không ạ?' };
    } else if (!ansArr[7]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/ Chị có muốn kết nối với tình nguyện viên/ tổ chức từ thiện khác ở cùng khu vực không ạ?' };
    } else if (!ansArr[8]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/ Chị có cần hỗ trợ chuyển tiền, hàng cứu trợ đến tận tay người được cứu trợ không ạ?' };
    } else if (!ansArr[9]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/ Chị có muốn huy động được nhiều nguồn lực hơn bằng truyền thông không ạ?' };
    } else if (!ansArr[10]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Về hình thức cứu trợ, Anh/Chị có nhu cầu Gửi tiền không ạ?' };
    } else if (!ansArr[11]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Vậy còn Gửi hàng có phải 1 trong những hình thức cứu trợ mà Anh/Chị đang quan tâm không ạ?' };
    } else if (!ansArr[12]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có đang quan tâm đến hình thức cứu trợ Hỗ trợ lâu dài không ạ?' };
    } else if (!ansArr[13]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có muốn cứu trợ bằng hình thức khác bên trên không ạ?' };
    } else if (!ansArr[14]){                    
      if(received_message.text === 'Có') {
        ansArr.push(received_message.text); 
        response = { "text": 'Vậy hình thức đó là gì ạ?' };
      } else if (received_message.text === 'Không') {
        ansArr.push('Không'); 
        response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Bất cứ ai có hoàn cảnh khó khăn không ạ?' };
      }
    } else if (ansArr[14] === 'Có'){                    
      ansArr[14] = received_message.text; 
      response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Bất cứ ai có hoàn cảnh khó khăn không ạ?' };
    } else if (!ansArr[15]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có ưu tiên giúp đỡ Người già không ạ?' };
    } else if (!ansArr[16]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Người bệnh có nằm trong danh sách đối tượng ưu tiên của Anh/Chị không ạ?' };
    } else if (!ansArr[17]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Đối tượng Anh/Chị ưu tiên có bao gồm Trẻ em không ạ?' };
    } else if (!ansArr[18]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Đối tượng Anh/Chị ưu tiên có phải là Nông dân không ạ?' };
    } else if (!ansArr[19]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Ngư dân có nằm trong danh sách đối tượng ưu tiên của Anh/Chị không ạ?' };
    } else if (!ansArr[20]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Trường học không ạ?' };
    } else if (!ansArr[21]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Đối tượng Anh/Chị ưu tiên có bao gồm Cơ sở Y tế không ạ?' };
    } else if (!ansArr[22]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Xây dựng hạ tầng (điện đường trường trạm) không ạ?' };
    } else if (!ansArr[23]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Cung cấp nước sạch, vệ sinh sạch không ạ?' };
    } else if (!ansArr[24]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có muốn ưu tiên giúp đỡ Cung cấp nhà an toàn trong lũ không ạ?' };
    } else if (!ansArr[25]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Có đối tượng khác ngoài các đối tượng bên trên mà Anh/Chị cũng muốn ưu tiên không ạ?' };
    } else if (!ansArr[26]){ 
      if(received_message.text === 'Có') {
        ansArr.push(received_message.text); 
        response = { "text": 'Vậy đối tượng đó là ai ạ?' };
      } else if (received_message.text === 'Không') {
        ansArr.push('Không'); 
        response = { "text": 'Anh/Chị có muốn chia sẻ Các dữ liệu các hoàn cảnh / hộ cần cứu trợ mà mình có không ạ?' };
      }
    } else if (ansArr[26] === 'Có'){                    
      ansArr[26] = received_message.text; 
      response = { "text": 'Anh/Chị có muốn chia sẻ Các dữ liệu các hoàn cảnh / hộ cần cứu trợ mà mình có không ạ?' };
    } else if (!ansArr[27]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Sau khi cứu trợ, Anh/Chị có muốn chia sẻ hình ảnh và thông tin đã cứu trợ với chúng tôi không ạ?' };
    } else if (!ansArr[28]){ 
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có muốn chia sẻ với chúng tôi bằng cách Tham gia tình nguyện viên cùng chiến dịch không ạ?' };
    } else if (!ansArr[29]){     
      ansArr.push(received_message.text); 
      response = { "text": 'Anh/Chị có Ý tưởng, Đề xuất khác muốn chia sẻ với cộng đồng không ạ?' };
    } else if (!ansArr[30]){   
      if(received_message.text === 'Có') {
        ansArr.push(received_message.text); 
        response = { "text": 'Vậy Anh/Chị muốn chia sẻ ý tưởng, đề xuất điều gì ạ?' };
      } else if (received_message.text === 'Không') {
        ansArr.push('Không'); 
        response = { "text": 'Việc thu thập thông tin này được thực hiện trong khuôn khổ Chiến dịch xã hội “Hỗ trợ người cứu trợ - Hướng về khúc ruột miền Trung”, được phát động bởi Đội tình nguyện viên Hỗ trợ điều phối thông tin cứu trợ.\n\nThông tin và yêu cầu của Anh/Chị đã được ghi nhận. Xin chân thành cảm ơn Anh/Chị đã dành thời gian trả lời ^^!' };
      }
    } else if (ansArr[30] === 'Có'){                    
      ansArr[30] = received_message.text; 
      response = { "text": 'Việc thu thập thông tin này được thực hiện trong khuôn khổ Chiến dịch xã hội “Hỗ trợ người cứu trợ - Hướng về khúc ruột miền Trung”, được phát động bởi Đội tình nguyện viên Hỗ trợ điều phối thông tin cứu trợ.\n\nThông tin và yêu cầu của Anh/Chị đã được ghi nhận. Xin chân thành cảm ơn Anh/Chị đã dành thời gian trả lời ^^!' };
    } 
    else if (!ansArr[31]){ 
      response = { "text": `Amazing Gút Chóp Anh/Chị\nCâu trả lời của Anh/Chị\n${ansArr}` };
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
        ansArr[0] = 1;
        let randNum = Math.floor(Math.random() * Object.keys(askNameQs).length) + 1;
        let txt = askNameQs[randNum];
        response = { "text": txt }
      } else if (payload === 'canhan') {
        ansArr[1] = "Cá nhân";
        let randNum = Math.floor(Math.random() * Object.keys(askPhoneNumQs).length) + 1;
        let txt = askPhoneNumQs[randNum];
        response = { "text": txt };
      } else if (payload === 'tochuc') {
        ansArr[1] = "Tổ chức";
        let randNum = Math.floor(Math.random() * Object.keys(askOrgQs).length) + 1;
        let txt = askOrgQs[randNum];
        response = { "text": txt };
      } else if (payload === 'donvikhac') {
        ansArr[1] = "Khác";
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
    }