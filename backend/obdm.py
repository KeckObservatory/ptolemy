
class OBDM():
    def __init__(self, ob):
        self.ob = ob
        self._parse_ob()
        self._update_db_object()
        #self.get_script() # the scripts should always be present
 
    def _parse_ob(self):
        """Init helper function
        """
        self.metadata = self.ob.get('metadata', None)
        self.acquisition = self.ob.get('acquisition', None)
        self.science = self.ob.get('science', None)
        self.target = self.ob.get('target', None)
        self.COMPONENTS = ['metadata', 'acquisition', 'science', 'target']

    def get_script(self, name, version):
        """Retrieves a string of a high level telescope command, 
        to be intrepreted by python thru a lookup table.
        """
        return self.ob.get('scripts', name, version)

    def _update_db_object(self):
        """Update to the database. If object does not exist in DB, then create
        new entry
        """
        print('sending updated ob to db...not implemented yet')
        pass

    def get_component(self, keyword):
        """Sequence is a portion of the data. 
        """
        assert keyword in self.COMPONENTS, f'keyword: {keyword} not in {self.COMPONENTS}' 
        return self.__dict__.get(keyword, False)

    def submit_for_observation(self):
        """Send this for observation 
        """
        pass