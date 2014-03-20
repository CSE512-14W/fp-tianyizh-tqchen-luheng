import socket
import sys

HOST, PORT = "localhost", 9911

data = '{xxx}'
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    # Connect to server and send data
    sock.connect((HOST, PORT))
    sock.sendall(data + "\n")
    # Receive data from the server and shut down
    received = sock.makefile().readline()
finally:
    sock.close()

print "Sent:     {}".format(data)
print "Received: {}".format(received)
