
from flask_login import current_user

from ..models import File

from time import perf_counter
from threading import Thread

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

class ImageLoader:
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

        print(self.images)
        return self.images

    @timer
    def load_thumbnails(self, archived=False):
        threads = []

        files = File.query.filter_by(user=current_user.username).all()
        if archived:
            files = [file for file in files if file.get_property("archived")]

        def _load_thumbnail(file):
            self.images.append({
                "name": file.name,
                "date_taken": file.date,
                "date_uploaded": file.get_property("date_uploaded"),
                "type": file.type,
                "size": file.size,
                "src": file.thumbnail
            })
        
        self.images = []
        for file in files:
            threads.append(Thread(target=_load_thumbnail, args=(file,)))

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join()

        return self.images
    