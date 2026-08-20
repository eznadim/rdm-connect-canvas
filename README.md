# Data Weaver

i need your help to build a page that is inspired from few things.
the functionality of this page is to bind data from RDM (Resource Data Management) Data Manager to frontend. check the images i pasted. the first image (the one that has Setpoint, Nav Link and Flow Link), is our legacy version. Left side is the drawing we export from Drawio (used mxgraph library), right side is where user can bind data to the drawing (it detects the individual cell). the flow for the binding is, user choose which page/drawing, then choose the controller by clicking the dropdown (which we get from the Data Manager), then choose list of data inside (it has 4 types of data, inputs, outputs, parameters and state), then click the cell where the user wants to bind the data. this is for Setpoint binding, for Nav Link binding, it works the same way but instead of binding data, it binds to another page/drawing, so once binded, and user click the cell it will go to that page/drawing. the old version is using vanilla php to connect the data which shouldnt be a thing anymore.
then on the third image i pasted, is the newer version of this layout but it needs optimization using the legacy idea. the way how the newer version works is, we export SVG onto frontend, then bind it. The flow for the newer version is choose which graph/SVG,  then click which cell to register which cell to bind, then choose what kind of bind (text/fill/navigation), for text and fill, user would need to add text based on the Data Manager's route and parameters (as well as change suffix if needed), for navigation, user would need to choose another page/drawing/SVG to redirect to where. the newer version is using nodered websocket to connect to Data Manager data through Context Data, example; controllerIp: "10.10.2.53"

controllerName: "1F01"

description: "WISMA GENTING_AHU OLD WING"

gpTimerIndex: 1

target: "http://www.resourcedm.com/RDMPlantTDB/2022/04/07/"

username: "rdmasia"

password: "900130c6ee764624ca7577bd76cacb6518718655"

zone: "Old Wing"

deviceName: "AHU-01"

return_air_temp: "25.4 Deg. C"

operation_state: "Stop"

aom_state: "Auto"

controls: object

commandItems: array[1]

0: object

controllerItem: "Mode Selection"

oriControllerItem: "AHU-01_Mode Selection"

value: "System Timer"

units: "None"

detail: object

type: "Dropdown"

selectionOne: "Manual Off"

selectionTwo: "Manual On"

selectionThree: "System Timer"

help me brainstorm and come up with a new layout that can be robust and clarity enough that any person can do this binding when they see the layout

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rdm-connect-canvas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c4fb526a-98eb-4b3a-9886-db0a072b5d86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
