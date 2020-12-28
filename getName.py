# -*- coding: utf-8 -*-
# from underthesea import chunk
from underthesea import ner
import sys

text = str(sys.argv[1])

arr = ner(text)
res = ""
for el in arr:
    if 'B-PER' in el or 'I-PER' in el:
        res += el[0] + " "  

print(res, end = "")
