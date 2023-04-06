Ptolemy Front End and API Deployment
======================================

Ptolemy interfaces with the ODT API, which access data stored in different areas. 

When a User Logs On
^^^^^^^^^^^^^^^^^^^

Upon entering the site, the user is immediately routed authentication server where they log in. Upon successful login, they are brought back
to the Ptolemy with an authentication cookie. This cookie is used to obtain a user's information from the ODT API, 
allowing Ptolemy to acquire OBs that are submitted to the Execution Engine.

.. warning:: WARNING:
   There is a bug in the authentication server that reroutes the execution engine to a erroneous address. after
   logging in alter the URL path from `https://http//vm-ddoiserver...` to `http://vm-ddoiserver...`.

Build and Change Procedure
---------------------------

Frontend
^^^^^^^^
While as dsibld@vm-ddoiserverbuild navigate to ``path/to/project`` and enter the command ``npm run build``.
When complete the frontend will be in the ``build`` file. Run as dsibld account.

.. code-block:: bash 

   cd /www/observers/
   git clone https://github.com/KeckObservatory/ptolemy.git 
   cd ./ptolemy
   npm install
   npm run build

.. note:: Note:
   When changing the frontend interface, run `npm run build` again to rebuild the GUI. 
   If a library has changed you must run `npm install && npm run build` instead.

In a browser go to `http://vm-ddoiserverbuild/observers/ptolemy/build/index.html <http://vm-ddoiserverbuild/observers/ptolemy/build/index.html>`_.
After logging in using your Windows account username and password, you should be greeted
by the Ptolemy GUI. 

Backend
^^^^^^^
In a separate terminal as dsibld@vm-ddoiserverbuild, execute the following lines of code. 

.. code-block:: bash 

   cd /ddoi/observers/ptolemy/backend
   kpython3 app.py

The frontend automatically connects to the backend. If the connection was successful you should see something similar to what is shown in the terminal below. 

.. figure:: _static/connection-accepted.png
   :width: 800

.. note:: Note:
   Changes to the backend, require you to restart the server with run `kpython3 app.py`. Changes to the ExecutionEngine and TranslatorModule packages also
   require a restart in this way. Keep in mind that Ptolemy's state will be lost when restarting the backend. The Queues will need to be remade. 
