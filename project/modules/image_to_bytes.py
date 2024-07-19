
from os.path import join, dirname
import re
from PIL import Image
from io import BytesIO

PNG_START = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00"
PNG_END = b"\x00\x00\x00\x00IEND\xaeB`\x82"

JPG_START = b"\xff\xd8"
JPG_END = b"\xff\xd9"

def get_bytes(filename):
    with open(join(dirname(__file__), filename), "rb") as f:
        image = f.read()
        b = bytearray(image)
        return b

def image_from_bytes(img_bytes: bytearray):
    return Image.open(BytesIO(img_bytes))

def find_image(chunk: bytearray, start_seq: bytes, end_seq: bytes):
    start = re.search(start_seq, chunk)
    end = re.search(end_seq, chunk)

    if not (start and end):
        return False
    
    span = (start.span()[0], end.span()[1])
    image_bytes = chunk[span[0]:span[1]]
    chunk = chunk[span[1]:]

    return image_bytes, chunk

def find_images(chunk):
    images = []

    img = find_image(chunk, PNG_START, PNG_END)
    if not img:
        img = find_image(chunk, JPG_START, JPG_END)

    if img:
        img_bytes, chunk = img

        images.append(img_bytes)

        if not chunk:
            return images
        
        images.extend(find_images(chunk))
        
    return images
        
if __name__ == "__main__":
    # Testing chunking image bytearrays together and then separating and showing them later.

    chunk = get_bytes("images/garfield1.png") #+ get_bytes("images/garfield2.png") + get_bytes("images/garfield3.jpg")
    images = find_images(chunk)

    print(len(chunk))
    print(len(images))

    image_from_bytes(images[0]).show()