import codecs
import re
import json

def unmangle_utf (match):
    escaped = match.group(0)                   # '\\u00e2\\u0082\\u00ac'
    hexstr = escaped.replace(r'\u', '')      # 'e282ac'
    buffer = codecs.decode(hexstr, "hex")      # b'\xe2\x82\xac'

    try:
        return buffer.decode('utf_16_be')           # '€'
    except UnicodeDecodeError:
        print("Could not decode buffer: %s" % buffer)

def regex_fix (input):
	return re.sub(
		r"(?i)(?:\\u[0-9a-f]{4})+",
		unmangle_utf,
		input
	)

with open("index.json") as read_file:
	word_list = json.loads(read_file.read())



with open("index_intro.json", "w") as f:
	f.write(regex_fix(json.dumps(word_list[:1000], indent="\t")))

with open("index_rest.json", "w") as f:
	f.write(regex_fix(json.dumps(word_list[1000:], indent="\t")))
