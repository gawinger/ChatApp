# ChatApp
Website allows users to sign in and then join chatrooms or create new ones.\
Rooms can be private - with password, or public.\
When creating new room user can select tags and add description about what he wants to talk about.\

## Technologies
App is created with **javascript** and **socket.io** library that enables realtime communication between web clients.\
Backend portion is made with **node.js** with **express.js**. Data about users and rooms is stored in **mongoDB** database.\
User authentication is created with **passport.js**.\
Additionally to maintain good atmosphere I added admin accounts that are capable of deleting chatrooms.\
