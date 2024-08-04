"""
Methods for loading images, file data, thumbnails, or searching for a file within a user's file store.
- FileLoader object
    -> Load images
    -> Load file thumbnails (allows both images and files)
    -> Search a given user for a file name.
"""

from flask_login import current_user

from ..models import User, File

from time import perf_counter
from threading import Thread

IMAGES = "images"
FILES = "files"

IMAGE_EXTENSIONS = [".JPEG", ".JPG", ".PNG", ".GIF"]

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
    images = []
    @timer
    def load(self, **keys):
        threads = []

        user_images = File.query.filter(File.user == current_user.username).all()

        user_images = [image for image in user_images if image.is_image]
        
        def _load_image(image: File):
            if image.extension == ".GIF":
                self.images[f"{image.id}:{image.name}"] = image.first_frame
            else:
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

    def load_thumbnail(self, file):
        file_json = {
            "name": file.name,
            "date_uploaded": file.get_property("date_uploaded"),
            "type": file.type,
            "size": file.size,
            "src": file.thumbnail
        }
        if file.is_image:
            file_json["date_taken"] = file.date
        self.images.append(file_json)

        return file_json
        
    @timer
    def load_thumbnails(self, _type=None, archived: bool = False):
        threads = []

        files = File.query.filter_by(user=current_user.username).all()

        if archived:
            files = [file for file in files if file.get_property("archived")]
        else:
            files = [file for file in files if not file.get_property("archived")]

        if _type == IMAGES:
            files = [file for file in files if file.extension in IMAGE_EXTENSIONS]
        elif _type == FILES:
            files = [file for file in files if file.extension not in IMAGE_EXTENSIONS]
        # If type is None -> all files

        self.images = []
        for file in files:
            threads.append(Thread(target=self.load_thumbnail, args=(file,)))

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join()
            
        return self.images

    def _binary_search(self, filenames: list[str], name: str, low_index: int, high_index: int):
        """
        Recursively accesses the middle value of a list of filenames and compares it with the name that is being searched,
        until the name is either found, in which case the method returns the index of the name,
        or returns None if the name is not found.

        Takes in a list of file names in the same order as the original files list,
        the name that is being searched, and the lower and highest indices of the lists.

        Returns None or <int>
        """
        # print(filenames[low_index:high_index], name, low_index, high_index)
        if low_index > high_index:
            return None
        else:
            middle_index = (high_index + low_index) // 2

            if name == filenames[middle_index]:
                return middle_index
            
            elif name > filenames[middle_index]:
                return self._binary_search(filenames, name, middle_index + 1, high_index)
            
            else:
                return self._binary_search(filenames, name, low_index, middle_index - 1)
        
    def search(self, name: str, user: User):
        """
        Searches the given user's files for a file name using the binary search algorithm [O(log n)].
        The file name given is case-sensitive
        
        Takes in the file name as a string, and a user which must be a User object (found in models.py).

        Returns the File object if found, and returns None if the file is not found.
        """
        files = user.files.copy()
        filenames = [file.name for file in files]

        file_index = self._binary_search(filenames, name, 0, len(filenames) - 1)

        if file_index == None:
            return None
        
        return files[file_index]