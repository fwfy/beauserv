import os
from queue import Queue
from collections import namedtuple
from flask import Flask, request



os.system('')
app = Flask(__name__)

class UserData:
    def __init__(self, password):
        self.password = password
        self.messages = Queue()

users = {
    "Grub4K": UserData("123"),
    "foofy": UserData("1234"),
    "sintrode": UserData("12345"),
}

usertokens = {}

# TODO: fix hex usage
def gen_user_token(username):
    token = os.urandom(128).hex()
    while token in usertokens:
        token = os.urandom(128).hex()
    usertokens[token] = username
    return token

@app.route('/signup', methods=['POST'])
def signup():
    return 'fail'
    username = request.form.get('username')
    if username not in users:
        password = request.form.get('password')
        if password:
            users[username] = UserData(password)
            return 'success'
    return 'fail'

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    if username in users:
        user = users[username]
        password = request.form.get('password')
        if user.password == password:
            return '\n'.join([
                "success",
                gen_user_token(username),
            ])
    return "fail"

@app.route('/send', methods=['POST'])
def send():
    token = request.form.get('token')
    username = usertokens.get(token)
    if username:
        message = request.form.get('message')
        for user in users.values():
            user.messages.put('{}:{}'.format(username, message))
        return 'success'
    return 'fail'

@app.route('/recv', methods=['POST'])
def recv():
    token = request.form.get('token')
    if token in usertokens:
        user = users[usertokens[token]]
        if not user.messages.empty():
            message = 'MSG ' + user.messages.get()
        else:
            message = 'END'
        return '\n'.join([
            'success',
            message
        ])
    return 'fail'

@app.route('/logout', methods=['POST'])
def logout():
    token = request.form.get('token')
    try:
        del usertokens[token]
    except:
        return 'fail'
    return 'success'

@app.route('/')
def root():
    return 'BatChat v1.0'
