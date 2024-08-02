# Stores all of the critical functions such as sort, search, hash, encrypt and decrypt.

from path import Path
from os.path import join, dirname
from datetime import datetime
from string import ascii_lowercase, ascii_uppercase
from random import choice
import base64

def quick_sort():
    ...

def binary_search():
    ...

def bitshift_hash(value: str):
    """
    Hashes a string into a unique key string.

    This does this by first performing a
    bitwise shift left to all chars and
    concatenates it onto the end of an integer.
    Then, the integer is converted to hex twice,
    and the '0x' prefix is stripped.
    Finally the string is returned.

    {Input: string}
    {Output: hashed<str>}
    """
    result = 0
    for char in value:
        result = (result << 5) - result + ord(char)

    hashed = str(result).encode().hex()
    hashed = hex(int(hashed))[2:]
    return hashed

def encrypt(value: str):
    return base64.b64encode(value.encode("utf-8"))

def decrypt(value: str):
    return base64.b64decode(value).decode("utf-8")

def log(text, filename = ".log", include_datetime=True):
    """
    Log a message to the text file at /instance/.log
    """
    modules_dir = Path(dirname(__file__))
    root = modules_dir.parent.parent
    log_path = join(root, "instance/" + filename)

    with open(log_path, "a") as f:
        now = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
        now = (now + " "*10)[:20]
        if include_datetime:
            text = f"{now} {text}\n"

        f.write(text)
    
    print(text)

LETTERS = [x for x in (ascii_lowercase + ascii_uppercase)]
def random_name(length: int):
    return "".join([choice(LETTERS) for _ in range(length)])
