import http.server
import socketserver
import logging

# 配置日志，指定日志名称
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - CustomHTTPServer - %(levelname)s - %(message)s'
)

PORT = 8080


class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        logging.info("%s - - [%s] %s\n" %
                     (self.client_address[0],
                      self.log_date_time_string(),
                      format % args))


with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
    # 设置超时时间为 5 秒
    httpd.socket.settimeout(5)
    logging.info(f"Serving static pages at port {PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info("Server stopped.")
