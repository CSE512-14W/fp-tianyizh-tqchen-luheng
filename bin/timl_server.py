#!/usr/bin/python
import SocketServer

class TIMLTCPHandler(SocketServer.StreamRequestHandler):
    def handle(self):
        self.data = self.rfile.readline().strip()
        print "{} wrote:".format(self.client_address[0])
        print self.data
        # Likewise, self.wfile is a file-like object used to write back
        # to the client
        self.wfile.write(self.data.upper())

if __name__ == "__main__":
    HOST, PORT = "localhost", 9911
    server = SocketServer.TCPServer((HOST, PORT), TIMLTCPHandler )
    server.serve_forever()
