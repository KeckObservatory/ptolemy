from threading import Thread, Event
thread = Thread()

class Gatekeeper(Thread):
    def __init__(self):
        super(Gatekeeper, self).__init__()
        self.rowId = 0
        self.tableStream = False 
        self.fileStream = False

    def switchTableStream(self, checked): 
        self.tableStream = checked 

    def switchFileStream(self, checked):
        self.fileStream = checked