
from flask_login import current_user

from ..models import File

from time import perf_counter
from threading import Thread

IMAGES = "images"
FILES = "files"

IMAGE_EXTENSIONS = [".JPEG", ".JPG", ".PNG"]

def timer(func):
    """
    Time how long a method takes. Output is in the terminal.
    """
    def wrapper(*args, **kwargs):
        start = perf_counter()
        data = func(*args, **kwargs)
        print(f"'{func.__name__}' took {perf_counter() - start} seconds")
        return data
    return wrapper

class FileLoader:
    @timer
    def load(self, **keys):
        threads = []

        user_images = File.query.filter(File.user == current_user.username)
        
        def _load_image(image: File):
            self.images[f"{image.id}:{image.name}"] = image.resize(height=240)

        self.images = {}
        for image in user_images:
            for key in keys:
                if image.get_property(key) != keys[key]:
                    break
            else:
                threads.append(Thread(target=_load_image, args=(image,)))

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join()

        return self.images

    @timer
    def load_thumbnails(self, _type=None, archived: bool = False):
        threads = []

        files = File.query.filter_by(user=current_user.username).all()

        if archived:
            files = [file for file in files if file.get_property("archived")]

        if _type == IMAGES:
            files = [file for file in files if file.extension in IMAGE_EXTENSIONS]
        elif _type == FILES:
            print([file.extension for file in files])
            files = [file for file in files if file.extension not in IMAGE_EXTENSIONS]
        # If type is None -> all files

        def _load_thumbnail(file):
            file_json = {
                "name": file.name,
                "date_uploaded": file.get_property("date_uploaded"),
                "type": file.type,
                "size": file.size,
                "src": file.thumbnail
            }
            if _type == IMAGES:
                file_json["date_taken"] = file.date
            self.images.append(file_json)
        
        self.images = []
        for file in files:
            threads.append(Thread(target=_load_thumbnail, args=(file,)))

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join()

        return self.images
    