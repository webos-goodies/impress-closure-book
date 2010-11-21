# coding=UTF-8

import os
import re

from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from django.utils import simplejson

# リクエストエラーの例外
class HttpError(RuntimeError):
  def __init__(self, code):
    self.code_ = code

  def get_code(self):
    return self.code_

  def __str__(self):
    return "HTTP ERROR : STATUS %d" % (self.code_)

# データモデルの定義
class UserData(db.Model):
  tree    = db.TextProperty(default='{"@type":"folder"}')
  next_id = db.IntegerProperty(default=0)

  def get_tree_obj(self):
    return simplejson.loads(self.tree)

  def get_next_id(self):
    self.next_id = self.next_id + 1
    return self.next_id

class FileData(db.Model):
  content = db.TextProperty()

# トップページのリクエストハンドラ
class TopPageHandler(webapp.RequestHandler):
  def get(self):
    user = users.get_current_user()
    UserData.get_or_insert(user.user_id())
    html = template.render('index.html', {
        'logout_url': users.create_logout_url(self.request.url),
        'user_name':  user.email(),
        'user_id':    user.user_id() })
    self.response.out.write(html)

# APIリクエストハンドラの基底クラス
class BaseHandler(webapp.RequestHandler):
  def post(self, user_id):
    self.validate_request(user_id)
    req_body = simplejson.loads(self.request.body)
    res_body = db.run_in_transaction(self.handle_post, req_body)
    self.output_json(res_body)

  def put(self, user_id):
    self.validate_request(user_id)
    req_body = simplejson.loads(self.request.body)
    res_body = db.run_in_transaction(self.handle_put, req_body)
    self.output_json(res_body)

  def delete(self, user_id):
    self.validate_request(user_id, False)
    res_body = db.run_in_transaction(self.handle_delete)
    self.output_json(res_body)

  def handle_post(self, req_body):
    raise HttpError(501)

  def handle_put(self, req_body):
    raise HttpError(501)

  def handle_delete(self, req_body):
    raise HttpError(501)

  def handle_exception(self, exception, debug_mode):
    if isinstance(exception, HttpError):
      self.error(exception.get_code())
      self.response.headers['Content-Type'] = 'text/plain'
      if debug_mode:
        self.response.out.write(exception)
      else:
        self.response.out.write('Error')
    else:
      super(BaseHandler, self).handle_exception(exception, debug_mode)

  def output_json(self, data):
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('while(1);' + simplejson.dumps(data))

  def validate_request(self, user_id, check_type=True):
    if user_id != users.get_current_user().user_id():
      raise HttpError(403)
    type = self.request.headers.get('Content-Type', '')
    if check_type and type.find('application/json') < 0:
      raise HttpError(400)

  def validate_path(self, path, allow_root):
    if path.find('/') < 0:
      if not allow_root:
        self.request.headers['Allow'] = 'GET, POST'
        raise HttpError(405)
    elif not re.search('/f\d+$', path):
      raise HttpError(404)

  def json_query(self, obj, path):
    path = path.split('/')
    del path[0] # パスの先頭要素を削除
    for id in path:
      if not (obj and (id in obj)):
        return None
      obj = obj[id]
    return obj

  def get_user_data(self):
    user = users.get_current_user()
    data = UserData.get_by_key_name(user.user_id())
    if not data:
      raise HttpError(500)
    return data

  def create_new_entry(self, user_data, parent_path, value):
    tree   = user_data.get_tree_obj()
    parent = self.json_query(tree, parent_path)
    key    = 'f%d' % user_data.get_next_id()
    if parent and parent['@type'] == 'folder':
      parent.setdefault('entry', {})[key] = value
      user_data.tree = simplejson.dumps(tree)
      user_data.put()
    else:
      raise HttpError(500)
    return { 'key': key, 'value': value }

# Tree APIのリクエスト処理
class TreeHandler(BaseHandler):
  def get(self, user_id):
    self.validate_request(user_id, False)
    user_data = self.get_user_data()
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('while(1);' + user_data.tree)

  def handle_post(self, req_body):
    user_data = self.get_user_data()
    path      = self.request.get('path', '')
    value     = { '@type': 'folder', '#text': req_body['#text'] or '' }
    self.validate_path(path, True)
    return self.create_new_entry(user_data, path, value)

  def handle_put(self, req_body):
    path = self.request.get('path', '')
    self.validate_path(path, False)
    user_data = self.get_user_data()
    tree      = user_data.get_tree_obj()
    node      = self.json_query(tree, path)
    if not node:
      raise HttpError(404)
    if '#text' in req_body:
      node['#text'] = req_body['#text']
      user_data.tree = simplejson.dumps(tree)
      user_data.put()
    return {}

  def handle_delete(self):
    path = self.request.get('path', '')
    self.validate_path(path, False)
    paths     = path.rpartition('/')
    user_data = self.get_user_data()
    tree      = user_data.get_tree_obj()
    entries   = self.json_query(tree, paths[0])
    if paths[2] in entries:
      node = entries[paths[2]]
      if ('entry' in node) and len(node['entry']) > 0:
        raise HttpError(500)

      if '@link' in node:
        file = FileData.get_by_id(int(node['@link'] or 0), user_data)
        if file:
          file.delete()

      del entries[paths[2]]
      user_data.tree = simplejson.dumps(tree)
      user_data.put()
      return {}
    else:
      raise HttpError(404)

# File APIのリクエスト処理
class FileHandler(BaseHandler):
  def get(self, user_id):
    self.validate_request(user_id, False)
    user_data = self.get_user_data()
    file      = self.find_file(user_data, self.request.get('id', None))
    self.output_json({ 'content': file.content })

  def handle_post(self, req_body):
    path = self.request.get('path', '')
    self.validate_path(path, True)
    user_data = self.get_user_data()
    file      = FileData(parent=user_data, content=req_body['content'])
    file.put()
    value = {
      '@type': 'file',
      '@link': file.key().id_or_name(),
      '#text': req_body['#text'] or '' }
    return self.create_new_entry(user_data, path, value)

  def handle_put(self, req_body):
      user_data    = self.get_user_data()
      file         = self.find_file(user_data, self.request.get('id', None))
      file.content = req_body['content']
      file.put()
      return {}

  def find_file(self, user_data, file_id):
    file = FileData.get_by_id(int(file_id or 0), user_data)
    if not file:
      raise HttpError(404)
    return file

# webappフレームワークの初期化
application = webapp.WSGIApplication([
  ('/([^/]+)/tree', TreeHandler),
  ('/([^/]+)/file', FileHandler),
  ('.*', TopPageHandler)], True)

def main():
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
