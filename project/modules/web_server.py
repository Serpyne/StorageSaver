from flask import Flask, Response, render_template

class EndpointAction:
    def __init__(self, action):
        self.action = action
        self.response = Response(status=200, headers={})

    def __call__(self, *args):
        self.action()
        return self.response

class FlaskAppWrapper:
    def __init__(self, name):
        self.app = Flask(name)

    def run(self):
        self.app.run()

    def add_endpoint(self, endpoint=None, endpoint_name=None, handler=None):
        self.app.add_url_rule(endpoint, endpoint_name, EndpointAction(handler))

class Server(Flask):
    def __init__(self, import_name=__name__, *args, **kwargs):
        super().__init__(import_name=import_name, *args, **kwargs)

        self.wrapper = FlaskAppWrapper("wrapper")
        
    def index(self):
        return "Hello, World!"

    def start(self):
        self.wrapper.add_endpoint(endpoint="/", endpoint_name="index", handler=self.index)

        self.run()