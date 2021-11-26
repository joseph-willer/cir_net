//var mathScript = document.createElement('script');  
//mathScript.setAttribute('src','https://unpkg.com/mathjs@9.5.1/browser/math.js');
//mathScript.setAttribute('type',"text/javascript");
//document.head.appendChild(mathScript);


var pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }


var canvas = document.getElementById("canvas");
canvas.style.cursor = "crosshair";
var ctx = canvas.getContext("2d");
var width = canvas.width, height = canvas.height;
var curX, curY, prevX, prevY;
var hold = false;
var fill_value = true, stroke_value = false;
ctx.lineWidth = 2;

var mouseIsDown = false;
var lastX = 0;
var lastY = 0;



var components = [];
var wires = [];
var nodes = []
var voltages = []
var gnd_node = 0
var buttons = []
var probes = []
var edit_boxes = []
var domain = 'dc'

scale = 1

//cir_pk = ''
if(typeof  cir_pk !== 'undefined'){
    data = load(cir_pk)
    console.log(data)
}


drawCircuit()
                        
function color (color_value){
    ctx.strokeStyle = color_value;
    ctx.fillStyle = color_value;
}    
        
function add_pixel (){
    ctx.lineWidth += 1;
}
        
function reduce_pixel (){
    if (ctx.lineWidth == 2)
        return;
    else
        ctx.lineWidth -= 1;
}
        
function fill (){
    fill_value = true;
    stroke_value = false;
}
        
function outline (){
    fill_value = false;
    stroke_value = true;
}
               
function reset (){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas_data = { "pencil": [], "line": [], "rectangle": [], "circle": [], "eraser": [] };
    components = []
    wires = []
    nodes = []
    probes = []
    img = []
    edit_boxes = []
    var container = document.getElementById('editor')
    while (container.firstChild){
        container.removeChild(container.firstChild)
    }
}

function getBox(element, data, key) {
    this.data = data;
    this.element = element;
    this.key = key;
    element.value = data;
    element.addEventListener("change", this, false);
}

getBox.prototype.handleEvent = function(event) {
    switch (event.type) {
        case "change": this.change(this.element.value);
    }
};

getBox.prototype.change = function(value) {
    this.data = value;
    this.element.value = value;
};

//var obj = new getBox(document.getElementById("functionbar"), "20");

function edit (){
    img = ctx.getImageData(0,0,width,height)
    editing = false;
    canvas.onmousedown = function(e){
        ctx.clearRect(0,0,canvas.width/scale,canvas.height/scale)
        solve()
        drawCircuit()
        //ctx.putImageData(img, 0, 0)
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;
        if(!editing){
            for(var i=0;i<components.length;i++){
                const component_rect = new Path2D();
                component_rect.rect(components[i].x, components[i].y, components[i].width, components[i].height)
                if(ctx.isPointInPath(component_rect, curX, curY)){
                    openComponentEdit(i)
                    editing = true;
                }
            }
        } else {
            button_hit = false;
            for(var i=0; i<buttons.length;i++){
                if(ctx.isPointInPath(buttons[i].path, curX, curY)){
                    console.log(buttons[i].path)
                    if(buttons[i].direction == 'up'){
                        button_hit = true;
                        components[buttons[i].component].value[Object.keys(components[buttons[i].component].value)[0]] = components[buttons[i].component].value[Object.keys(components[buttons[i].component].value)[0]] + 1
                    } else if(buttons[i].direction=='down'){
                        button_hit = true;
                        components[buttons[i].component].value[Object.keys(components[buttons[i].component].value)[0]] = components[buttons[i].component].value[Object.keys(components[buttons[i].component].value)[0]] - 1
                    } else if(buttons[i].direction=='set'){
                        button_hit = true;
                        for(var j=0; j<edit_boxes.length;j++){
                            console.log(edit_boxes[j].key)
                            components[buttons[i].component].value[edit_boxes[j].key] = parseFloat(edit_boxes[j].data);
                            if(edit_boxes[j].key=='frequency'){
                                frequency = parseFloat(edit_boxes[j].data)
                            }
                        }
                        //components[buttons[i].component].value.amplitude = parseFloat(obj.data);
                    }
                    ctx.clearRect(0,0,canvas.width/scale,canvas.height/scale)
                    solve()
                    drawCircuit()
                    drawComponentEdit(components[buttons[i].component])
                } else {
                    buttons = []
                    edit_boxes = []
                    var container = document.getElementById('editor')
                    while (container.firstChild){
                        container.removeChild(container.firstChild)
                    }
                    solve()
                    ctx.clearRect(0,0,canvas.width/scale,canvas.height/scale)
                    drawCircuit()
                    editing = false;
                }
            }
            if(button_hit == false){
                //ctx.putImageData(img, 0,0)
                buttons = []
                edit_boxes = []
                var container = document.getElementById('editor')
                while (container.firstChild){
                    container.removeChild(container.firstChild)
                }
                solve()
                ctx.clearRect(0,0,canvas.width/scale,canvas.height/scale)
                drawCircuit()
                editing = false;
            }
            
        }
        
  
    }
    canvas.onmouseup = function (e){
        hold = false;
    };
    canvas.onmousemove = function (e){
        hold = false;
    };
}

function drawComponentEdit(component){
    var container = document.getElementById('editor')
    while (container.firstChild){
        container.removeChild(container.firstChild)
    }
    for(var j=0;j<Object.keys(component.value).length;j++){
        if(Object.keys(component.value)[j] != 'frequency' || domain == 'ac'){
            container.appendChild(document.createTextNode(Object.keys(component.value)[j]));
            var input = document.createElement('input');
            input.type = 'text';
            input.name = Object.keys(component.value)[j];
            //input.value = component.value[Object.keys(component.value)[j]];
            var obj = new getBox(input, component.value[Object.keys(component.value)[j]], Object.keys(component.value)[j])
            edit_boxes.push(obj)
            container.appendChild(input);
            container.appendChild(document.createElement("br"));
        }
    }
    ctx.beginPath()
    ctx.moveTo(component.x, component.y);

    ctx.fillStyle = 'black'
    ctx.fillRect(component.x, component.y, 50+8*(component.value[Object.keys(component.value)[0]].toString().length), -120)
    ctx.fillStyle = 'green'
    ctx.moveTo(component.x+10, component.y-70)
    console.log(component.value[Object.keys(component.value)[0]].toString().length)
    ctx.lineTo(component.x+25+4*(component.value[Object.keys(component.value)[0]].toString().length), component.y-90)
    ctx.lineTo(component.x+40+8*(component.value[Object.keys(component.value)[0]].toString().length), component.y-70)
    ctx.moveTo(component.x+10, component.y-30)
    ctx.lineTo(component.x+25+4*(component.value[Object.keys(component.value)[0]].toString().length), component.y-10)
    ctx.lineTo(component.x+40+8*(component.value[Object.keys(component.value)[0]].toString().length), component.y-30)
    ctx.font = "18px Arial";
    ctx.fillText('SET', component.x+8+4*(component.value[Object.keys(component.value)[0]].toString().length), component.y-105)
    if(component.comp_type=="resistor"){
        ctx.fillText(component.value[Object.keys(component.value)[0]].toPrecision(4)+" Ω", component.x+10, component.y-43)
    } else if(component.comp_type=="voltage"){
        ctx.fillText(component.value[Object.keys(component.value)[0]].toPrecision(4)+" V", component.x+10, component.y-43)
    } else if(component.comp_type=="inductor"){
        ctx.fillText(component.value[Object.keys(component.value)[0]].toPrecision(4)+" H", component.x+10, component.y-43)
    } else if(component.comp_type=="capacitor"){
        ctx.fillText(component.value[Object.keys(component.value)[0]].toPrecision(4)+" F", component.x+10, component.y-43)
    }
    
    ctx.font = "28px Arial";
    //ctx.fillText("+", component.x+10, component.y-80)
    //ctx.fillText("-", component.x+10, component.y-20)
    ctx.strokeStyle = "green"
    ctx.stroke()
    ctx.strokeStyle = "black"
}


function openComponentEdit(i){

    buttons = []
    setbut = new Path2D();
    setbut.rect(components[i].x, components[i].y-120, 40+8*(components[i].value[Object.keys(components[i].value)[0]].toString().length), 20)
    buttons.push({path: setbut, component:i, direction:'set'})
    //if(components[i].type == 'resistor'){
        drawComponentEdit(components[i])
        upbut = new Path2D();
        upbut.rect(components[i].x, components[i].y-100, 40+8*(Math.floor(Math.log10(components[i].value[Object.keys(components[i].value)[0]]))), 30)
        buttons.push({path: upbut, component:i, direction:'up'})
        downbut = new Path2D();
        downbut.rect(components[i].x, components[i].y-30, 40+8*(Math.floor(Math.log10(components[i].value[Object.keys(components[i].value)[0]]))), 30)
        buttons.push({path: downbut, component:i, direction:'down'})
    /*} else if(components[i].type == 'voltage'){
        drawComponentEdit(components[i])
        upbut = new Path2D();
        upbut.rect(components[i].x, components[i].y-100, 40+8*(Math.floor(Math.log10(components[i].value[Object.keys(components[i].value)[0]]))), 30)
        buttons.push({path: upbut, component:i, direction:'up'})
        downbut = new Path2D();
        downbut.rect(components[i].x, components[i].y-30, 40+8*(Math.floor(Math.log10(components[i].value[Object.keys(components[i].value)[0]]))), 30)
        buttons.push({path: downbut, component:i, direction:'down'})
    }*/
}

// line tool
        
function line (){
           
    canvas.onmousedown = function (e){
        img = ctx.getImageData(0, 0, width, height);
        prevX = (e.clientX - canvas.offsetLeft)/scale;
        prevY = (e.clientY - canvas.offsetTop)/scale;
        hold = true;
    };
            
    canvas.onmousemove = function (e){
        if (hold){
            ctx.putImageData(img, 0, 0);
            curX = (e.clientX - canvas.offsetLeft)/scale;
            curY = (e.clientY - canvas.offsetTop)/scale;;
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(curX, curY);
            ctx.stroke();
            canvas_data.line.push({ "starx": prevX, "starty": prevY, "endx": curX, "endY": curY,
                 "thick": ctx.lineWidth, "color": ctx.strokeStyle });
            ctx.closePath();
        }
    };
            
    canvas.onmouseup = function (e){
         hold = false;
    };
            
    canvas.onmouseout = function (e){
         hold = false;
    };
}

function move (){
    var mouseIsDown = false;
    canvas.onmousedown = function (e){

        mouseX = (e.clientX - canvas.offsetLeft)/scale;
        mouseY = (e.clientY - canvas.offsetTop)/scale;

        // mousedown stuff here
        lastX = mouseX;
        lastY = mouseY;
        mouseIsDown = true;

    }

    canvas.onmouseup = function (e) {
        mouseX = (e.clientX - canvas.offsetLeft)/scale;
        mouseY = (e.clientY - canvas.offsetTop)/scale;
    
        // mouseup stuff here
        mouseIsDown = false;
    }

    canvas.onmousemove = function (e){

        if (!mouseIsDown) {
            return;
        }

        mouseX = (e.clientX - canvas.offsetLeft)/scale;
        mouseY = (e.clientY - canvas.offsetTop)/scale;

        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            const comp_rect = new Path2D();
            comp_rect.rect(component.x-component.width/2, component.y+component.height/9, component.width, 8*component.height/9);
            if (ctx.isPointInPath(comp_rect, lastX, lastY)) {
                component.x += (mouseX - lastX);
                component.y += (mouseY - lastY);
            }
        }
        lastX = mouseX;
        lastY = mouseY;
        drawCircuit();
    }
}


function checkWires(curX, curY, wires, wiring_status){
    for(var i = 0; i< wires.length; i++) {
        wire_ins = wires[i]
        wire_path_result = checkWirePath(wire_ins, curX, curY);
        //console.log(wire_path)
        if(wiring_status.wire_started==false && !wiring_status.wire_start){
            if(wire_path_result.status){
                img = ctx.getImageData(0, 0, width, height);
                new_wire = makeWire(wire_path_result.point.x, wire_path_result.point.y, curX, curY, wire_ins.node)
                wiring_status.wire_started = true;
                wiring_status.wire_start= true;
                return({new_wire: new_wire, wiring_status: wiring_status})
            }
        } else if(wiring_status.wire_started==true) {
            if(wire_path_result.status){
                new_wire.x2 = wire_path_result.point.x;
                new_wire.y2 = wire_path_result.point.y;
                wires.push(new_wire)
                new_data = mapNodes(components, wires, new_wire.node, wire_ins.node)
                wiring_status.wire_started = false;
                wiring_status.wire_start= false;
                return({new_wires: new_data.wires, new_components: new_data.components, wiring_status: wiring_status})
            }
        }
    }
    return({wiring_status: wiring_status})
}

function checkComponents(curX, curY, components, wires, wiring_status){
    console.log(wiring_status)
    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        const node1 = new Path2D();
        node1.rect((component.x-component.width/2)/scale, (component.y-component.height/6)/scale, component.width/scale, 2*component.height/6/scale)
        const node2 = new Path2D();
        node2.rect((component.x-component.width/2)/scale, (component.y+5*component.height/6)/scale, component.width/scale, 2*component.height/6/scale)
        if(wiring_status.wire_started==false && !wiring_status.wire_start){
            if (ctx.isPointInPath(node1, curX, curY)) {
                img = ctx.getImageData(0, 0, width, height);
                new_wire = makeWire(component.x, component.y, curX, curY, component.nodes[0])
                wiring_status.wire_started = true;
                wiring_status.wire_start= true;
                return({new_wire: new_wire, wiring_status: wiring_status});
            } else if (ctx.isPointInPath(node2, curX, curY)) {
                img = ctx.getImageData(0, 0, width, height);
                new_wire = makeWire(component.x, component.y+component.height, curX, curY, component.nodes[1])
                wiring_status.wire_started = true;
                wiring_status.wire_start = true;
                return({new_wire: new_wire, wiring_status: wiring_status});
            } 
        } else if(wiring_status.wire_started==true){
            console.log(ctx.isPointInPath(node1, curX, curY), ctx.isPointInPath(node2, curX, curY))
            if (ctx.isPointInPath(node1, curX, curY)) {
                new_wire.x2 = component.x;
                new_wire.y2 = component.y;
                wires.push(new_wire)
                new_data = mapNodes(components, wires, new_wire.node, component.nodes[0])
                wiring_status.wire_started = false;
                wiring_status.wire_start= false;
                return({new_wires: new_data.wires, new_components: new_data.components, wiring_status: wiring_status});
            } else if (ctx.isPointInPath(node2, curX, curY)){
                new_wire.x2 = component.x;
                new_wire.y2 = component.y+component.height;
                console.log(new_wire)
                wires.push(new_wire)
                new_data = mapNodes(components, wires, new_wire.node, component.nodes[1])
                wiring_status.wire_started = false;
                wiring_status.wire_start= false;
                return({new_wires: new_data.wires, new_components: new_data.components, wiring_status: wiring_status});
            }
        }
    }
    return({wiring_status: wiring_status})
}

function changeDomain(){
    if(domain=='dc'){
        frequency = 60;
        domain='ac';
    } else {
        domain = 'dc';
    }
    drawCircuit();
    img = ctx.getImageData(0,0,width,height)    
}

function wire (){
    drawCircuit()
    var wiring_status = {wire_started: false, wire_start: false}
    //console.log(wiring_status.wire_started)
    canvas.onmousedown = function (e){
        console.log(nodes)
        console.log(components)
        console.log(wires)
        //console.log(wiring_status.wire_started)
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;;

        var compCheck = checkComponents(curX, curY, components, wires, wiring_status)
        wiring_status = compCheck.wiring_status
        if(compCheck.new_wires?.length>0){
            console.log(compCheck.new_wires)
            wires = compCheck.new_wires
            components = compCheck.new_components
            drawCircuit()
            return
        } else if(typeof compCheck.new_wire != 'undefined'){
            new_wire = compCheck.new_wire;
            wiring_status.wire_start = false;
            return
        }


        var wireCheck = checkWires(curX, curY, wires, wiring_status)
        wiring_status = wireCheck.wiring_status
        if(wireCheck.new_wires?.length>0){
            wires = wireCheck.new_wires
            drawCircuit()
            return
        } else if(typeof wireCheck.new_wire != 'undefined'){
            new_wire = wireCheck.new_wire
            wiring_status.wire_start = false;
            return
        }


        if(wiring_status.wire_started==true && !wiring_status.wire_start){
            ctx.putImageData(img, 0, 0)
            if(pressedKeys[16]==true){
                if(new_wire.midpoints.length>0){
                    last_point=new_wire.midpoints[new_wire.midpoints.length-1]
                } else {
                    last_point = ({x: new_wire.x1, y: new_wire.y1})
                }
                if(Math.abs(last_point.x-curX)>Math.abs(last_point.y-curY)){
                    new_wire.midpoints.push({
                        x: curX,
                        y: last_point.y
                    })
                    new_wire.x2 = curX;
                    new_wire.y2 = last_point.y;
                } else {
                    new_wire.midpoints.push({
                        x: last_point.x,
                        y: curY
                    })
                    new_wire.x2 = last_point.x;
                    new_wire.y2 = curY;
                }  
            } else {
                new_wire.midpoints.push({
                    x: curX,
                    y: curY
                })
                new_wire.x2 = curX;
                new_wire.y2 = curY;
            }
            drawWire(new_wire);
        } else if(wiring_status.wire_started==true){
            wiring_status.wire_start = false;
        } else {
            drawCircuit()
        }
    }

    canvas.onmousemove = function (e){
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;;
        //console.log(wires)
        if(!wiring_status.wire_started){
            return
        }
        ctx.putImageData(img, 0, 0)
        if(pressedKeys[16]==true){
            if(new_wire.midpoints.length>0){
                last_point=new_wire.midpoints[new_wire.midpoints.length-1]
            } else {
                last_point = ({x: new_wire.x1, y: new_wire.y1})
            }
            if(Math.abs(last_point.x-curX)>Math.abs(last_point.y-curY)){
                new_wire.x2 = curX;
                new_wire.y2 = last_point.y;
            } else {
                new_wire.x2 = last_point.x;
                new_wire.y2 = curY;
            }  
        } else {
            new_wire.x2 = curX;
            new_wire.y2 = curY;
        }
        drawWire(new_wire);
    }


}

function ground(){
    img = ctx.getImageData(0,0,width,height)
    node_count = nodes.length
    voltage = 0
    gnd_exists = false;
    for(var i=0; i<components.length; i++){
        if(components[i].comp_type == 'ground'){
            gnd_exists = true;
            node1 = components[i].nodes[0]
        }
    }
    if(!gnd_exists){
        node1 = node_count+1
        nodes.push(node1)
    }
    gnd = makeComponent(-50, -50, 20, 30, voltage, 'ground', [node1])
    var new_gnd = true;
    canvas.onmousedown = function (e){
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;;
        components.push(gnd);
        new_gnd = false;
        if(pressedKeys[18]==true){
            img = ctx.getImageData(0,0,width,height)
            gnd = makeComponent(curX, curY, 20, 30, voltage, 'ground', [node1])
            new_gnd = true;
        }
        drawCircuit();
    };
    canvas.onmousemove = function (e){
        if(new_gnd){
            ctx.putImageData(img, 0, 0);
            curX = (e.clientX - canvas.offsetLeft)/scale;
            curY = (e.clientY - canvas.offsetTop)/scale;;
            gnd.x = curX;
            gnd.y = curY;
            gnd.right = curX+gnd.width;
            gnd.bottom = curY+gnd.height;
            drawComponent(gnd);
        }
    };
}

function inductor (){
    drawCircuit()
    img = ctx.getImageData(0,0,width,height)
    node_count = nodes.length
    node1 = node_count+1
    node2 = node1+1
    nodes.push(node1)
    nodes.push(node2)
    inductance = 0.001;
    resistance = 0;
    ind = makeComponent(-50, -50, 20, 50, {inductance: inductance, resistance: resistance}, 'inductor', [node1, node2])
    var new_ind = true;
    canvas.onmousedown = function (e){
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;
        components.push(ind);
        new_ind = false;
        if(pressedKeys[18]==true){
            img = ctx.getImageData(0,0,width,height)
            node_count = nodes.length
            node1 = node_count+1
            node2 = node1+1
            nodes.push(node1)
            nodes.push(node2)
            ind = makeComponent(-50, -50, 20, 50, {inductance: inductance, resistance: resistance}, 'inductor', [node1, node2])
            new_ind = ind;
        }
        drawCircuit();
    };
        
    canvas.onmousemove = function (e){
        if(new_ind){
            ctx.putImageData(img, 0, 0);
            curX = (e.clientX - canvas.offsetLeft)/scale;
            curY = (e.clientY - canvas.offsetTop)/scale;
            ind.x = curX;
            ind.y = curY;
            ind.right = curX+ind.width;
            ind.bottom = curY+ind.height;
            drawComponent(ind);
        }
    };
        
    canvas.onmouseup = function (e){
        hold = false;
    };
        
    canvas.onmouseout = function (e){
        hold = false;
    };
}

function voltageSource (){
    img = ctx.getImageData(0,0,width,height)
    node_count = nodes.length
    node1 = node_count+1
    node2 = node1+1
    nodes.push(node1)
    nodes.push(node2)
    amplitude = 12
    frequency = 60
    
    vs = makeComponent(-50, -50, 20, 50, {amplitude: amplitude, frequency: frequency}, 'voltage', [node1, node2])
    var new_vs = true;
    canvas.onmousedown = function (e){
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;;
        components.push(vs);
        new_vs = false;
        if(pressedKeys[18]==true){
            img = ctx.getImageData(0,0,width,height)
            node_count = nodes.length
            node1 = node_count+1
            node2 = node1+1
            nodes.push(node1)
            nodes.push(node2)
            vs = makeComponent(-50, -50, 20, 50, {amplitude: amplitude, frequency: frequency}, 'voltage', [node1, node2])
            new_vs = true;
        }
        drawCircuit();
    };
        
    canvas.onmousemove = function (e){
        if(new_vs){
            ctx.putImageData(img, 0, 0);
            curX = (e.clientX - canvas.offsetLeft)/scale;
            curY = (e.clientY - canvas.offsetTop)/scale;;
            vs.x = curX;
            vs.y = curY;
            vs.right = curX+vs.width;
            vs.bottom = curY+vs.height;
            drawComponent(vs);
        }
    };
        
    canvas.onmouseup = function (e){
        hold = false;
    };
        
    canvas.onmouseout = function (e){
        hold = false;
    };

}

function probe (){
    solve()
    //drawCircuit()
    probing = true
    img = ctx.getImageData(0,0,width,height)
    canvas.onmousemove = function (e){
        if(!probing){
            return
        }
        ctx.putImageData(img, 0, 0);
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;
        voltage = 0
        voltage_print = 0
        for(var i=0; i<wires.length; i++){
            var result = checkWirePath(wires[i], curX, curY)
            if(result.status){
                voltage=voltages.find(el => el.node === wires[i].node).voltage
                if(domain=='ac'){
                    comp_voltage = math.complex(voltage.real, voltage.imag)
                    var phase = (math.arg(comp_voltage)*180/Math.PI).toPrecision(4)
                    var magnitude = math.abs(comp_voltage).toPrecision(4)
                    voltage_print = magnitude.toString()+' V - '+phase.toString()+'°'
                } else if(domain=='dc'){
                    voltage_print = voltage.real+' V'
                }
                
            }
        }
        for(var i=0; i<components.length;i++){
            var result = checkComponents(curX, curY, components[i])
        }
        drawResult(curX, curY, voltage_print)
    }
    canvas.onmousedown = function (e){
        ctx.putImageData(img, 0, 0);
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;
        voltage = 0
        wire_hit = false;
        for(var i=0; i<wires.length; i++){
            var result = checkWirePath(wires[i], curX, curY)
            if(result.status){
                probes.push({x: curX, y: curY, wire: wires[i]})
                wire_hit = true
            }
        }
        if(!wire_hit){
            probing = !probing
        }
        drawCircuit()
        img = ctx.getImageData(0,0,width,height)
    }
}

function capacitor (){
    drawCircuit()
    img = ctx.getImageData(0,0,width,height)
    node_count = nodes.length
    node1 = node_count+1
    node2 = node1+1
    nodes.push(node1)
    nodes.push(node2)
    capacitance = 0.000001
    cap = makeComponent(-50, -50, 16, 50, {capacitance: capacitance}, 'capacitor', [node1, node2])
    var new_cap = true;
    canvas.onmousedown = function (e){
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;
        components.push(cap);
        new_cap = false;
        if(pressedKeys[18]==true){
            img = ctx.getImageData(0,0,width,height)
            node_count = nodes.length
            node1 = node_count+1
            node2 = node1+1
            nodes.push(node1)
            nodes.push(node2)
            cap = makeComponent(-50, -50, 16, 50, {capacitance: capacitance}, 'capacitor', [node1, node2])
            new_cap = true;
        }
        drawCircuit();
    };
        
    canvas.onmousemove = function (e){
        if(new_cap){
            ctx.putImageData(img, 0, 0);
            curX = (e.clientX - canvas.offsetLeft)/scale;
            curY = (e.clientY - canvas.offsetTop)/scale;
            cap.x = curX;
            cap.y = curY;
            cap.right = curX+cap.width;
            cap.bottom = curY+cap.height;
            drawComponent(cap);
        }
    };
        
    canvas.onmouseup = function (e){
        hold = false;
    };
        
    canvas.onmouseout = function (e){
        hold = false;
    };
}

function resistor (){
    drawCircuit()
    img = ctx.getImageData(0,0,width,height)
    node_count = nodes.length
    node1 = node_count+1
    node2 = node1+1
    nodes.push(node1)
    nodes.push(node2)
    
    value = 1;
    res = makeComponent(-50, -50, 12, 50, {resistance: value}, 'resistor', [node1, node2])
    var new_res = true;
    canvas.onmousedown = function (e){
        curX = (e.clientX - canvas.offsetLeft)/scale;
        curY = (e.clientY - canvas.offsetTop)/scale;
        components.push(res);
        new_res = false;
        if(pressedKeys[18]==true){
            img = ctx.getImageData(0,0,width,height)
            node_count = nodes.length
            node1 = node_count+1
            node2 = node1+1
            nodes.push(node1)
            nodes.push(node2)
            res = makeComponent(-50, -50, 12, 50, {resistance: value}, 'resistor', [node1, node2])
            new_res = true;
        }
        drawCircuit();
    };
        
    canvas.onmousemove = function (e){
        if(new_res){
            ctx.putImageData(img, 0, 0);
            curX = (e.clientX - canvas.offsetLeft)/scale;
            curY = (e.clientY - canvas.offsetTop)/scale;
            res.x = curX;
            res.y = curY;
            res.right = curX+res.width;
            res.bottom = curY+res.height;
            drawComponent(res);
        }
    };
        
    canvas.onmouseup = function (e){
        hold = false;
    };
        
    canvas.onmouseout = function (e){
        hold = false;
    };

}
        
// eraser tool
        

/*
function save (){
    var filename = document.getElementById("fname").value;
    var data = JSON.stringify(canvas_data);
    var image = canvas.toDataURL();
    
    $.post("/", { save_fname: filename, save_cdata: data, save_image: image });
    alert(filename + " saved");
    
} 
*/
function drawResult(x, y, value){
    ctx.beginPath()
    ctx.moveTo(x, y);
    ctx.fillStyle = 'black'
    if(value>0){
        ctx.fillRect(x, y, 93+15*(Math.floor(Math.log10(value))), -50)
    } else {
        ctx.fillRect(x, y, 93, -50)
    }
    ctx.fillStyle = 'green'
    ctx.font = "30px Arial";
    ctx.fillText(value, x+10, y-10)
    ctx.stroke()
}

function drawCircuit(){
    console.log('drawing circuit')
    ctx.clearRect(0,0,canvas.width/scale,canvas.height/scale)
    for(var i=0; i<components.length; i++){
        var component = components[i]
        drawComponent(component);
    }
    for(var i=0; i<wires.length; i++){
        var wire = wires[i]
        drawWire(wire);
    }
    for(var i=0; i<probes.length; i++){
        for(var j=0;j<wires.length; j++){
            var result = checkWirePath(wires[j], probes[i].x, probes[i].y)
            if(result.status){
                voltage=voltages.find(el => el.node === wires[j].node).voltage
                voltage_print = voltage.real.toString()+' j'+voltage.imag.toString()
                console.log(voltage)
            }
        }
        drawResult(probes[i].x, probes[i].y, voltage_print)
    } 
}

function drawComponent(component){
    console.log('drawing component')
    ctx.fillStyle = 'black'
    ctx.font = "14px Arial";
    console.log(component.comp_type)
    if(component.comp_type=='resistor'){
        ctx.beginPath();
        ctx.moveTo(component.x, component.y);
        //ctx.fillText(component.nodes[0], component.x-20, component.y)
        ctx.lineTo(component.x, component.y+component.height/9);
        ctx.lineTo(component.x-component.width/2, component.y+2*component.height/9);
        ctx.lineTo(component.x+component.width/2, component.y+3*component.height/9);
        ctx.lineTo(component.x-component.width/2, component.y+4*component.height/9);
        ctx.lineTo(component.x+component.width/2, component.y+5*component.height/9);
        ctx.lineTo(component.x-component.width/2, component.y+6*component.height/9);
        ctx.lineTo(component.x+component.width/2, component.y+7*component.height/9);
        ctx.lineTo(component.x, component.y+8*component.height/9);
        ctx.lineTo(component.x, component.y+component.height);
        //ctx.fillText(component.nodes[1], component.x-20, component.y+component.height)
        ctx.stroke();
    } else if (component.comp_type == 'voltage'){
        ctx.beginPath();
        ctx.moveTo(component.x, component.y);
        ctx.font = "20px Arial";
        if(domain=='dc'){
            ctx.fillText('+', component.x-6, component.y+5*component.height/11)
            ctx.fillText('-', component.x-3, component.y+4*component.height/5)
        } else {
            ctx.fillText('~', component.x-5, component.y+2.5*component.height/4)
        }
        ctx.font = "14px Arial";
        //ctx.fillText(component.nodes[0], component.x-20, component.y)
        ctx.lineTo(component.x, component.y+component.height/8);
        ctx.arc(component.x, component.y+component.height/2, 3*component.height/8, 3*Math.PI/2, 11*Math.PI/2);
        ctx.moveTo(component.x, component.y+7*component.height/8);
        ctx.lineTo(component.x, component.y+component.height);
        //ctx.fillText(component.nodes[1], component.x-20, component.y+component.height)
        ctx.stroke();
    } else if (component.comp_type == 'ground'){
        ctx.beginPath();
        ctx.moveTo(component.x, component.y);
        ctx.lineTo(component.x, component.y+2*component.height/8);
        ctx.moveTo(component.x-component.width/2, component.y+2*component.height/8);
        ctx.lineTo(component.x+component.width/2, component.y+2*component.height/8);
        ctx.moveTo(component.x-component.width/3, component.y+4*component.height/8);
        ctx.lineTo(component.x+component.width/3, component.y+4*component.height/8);
        ctx.moveTo(component.x-component.width/6, component.y+6*component.height/8);
        ctx.lineTo(component.x+component.width/6, component.y+6*component.height/8);
        ctx.stroke();
    } else if (component.comp_type == 'inductor'){
        ctx.beginPath();
        ctx.moveTo(component.x, component.y);
        ctx.lineTo(component.x, component.y+component.height/8);
        //ctx.moveTo(component.x+component.height/8/Math.sqrt(2), component.y+2*component.height/8+component.height/8/Math.sqrt(2))
        ctx.arc(component.x, component.y+2*component.height/8, component.height/8, -Math.PI/2, 3*Math.PI/4);
        ctx.arc(component.x, component.y+2*component.height/8+component.height/8*Math.sqrt(2), component.height/8, -3*Math.PI/4, 3*Math.PI/4);
        ctx.arc(component.x, component.y+2*component.height/8+2*component.height/8*Math.sqrt(2), component.height/8, -3*Math.PI/4, 3*Math.PI/4);
        ctx.arc(component.x, component.y+2*component.height/8+3*component.height/8*Math.sqrt(2), component.height/8, -3*Math.PI/4, Math.PI/2);
        ctx.moveTo(component.x, component.y+7.2*component.height/8);
        ctx.lineTo(component.x, component.y+component.height);
        ctx.stroke();
    } else if (component.comp_type == 'capacitor'){
        ctx.beginPath();
        ctx.moveTo(component.x, component.y);
        ctx.lineTo(component.x, component.y+2*component.height/5)
        ctx.moveTo(component.x-component.width/2, component.y+2*component.height/5)
        ctx.lineTo(component.x+component.width/2, component.y+2*component.height/5)
        ctx.moveTo(component.x-component.width/2, component.y+3*component.height/5)
        ctx.lineTo(component.x+component.width/2, component.y+3*component.height/5)
        ctx.moveTo(component.x, component.y+3*component.height/5)
        ctx.lineTo(component.x, component.y+component.height)
        ctx.stroke()
    }
}

function drawWire(wire_ins){
    console.log('drawing wire')
    ctx.beginPath();
    ctx.moveTo(wire_ins.x1, wire_ins.y1);
    mps = wire_ins.midpoints
    lastX = wire_ins.x1;
    lastY = wire_ins.y1;
    if(mps.length>0){
        for(i=0; i<mps.length;i++){
            dx = Math.abs(mps[i].x - lastX)
            dy = Math.abs(mps[i].y - lastY)
            if(dx>dy){
                ctx.lineTo(lastX, mps[i].y)
                ctx.lineTo(mps[i].x, mps[i].y)
            } else {
                ctx.lineTo(mps[i].x, lastY)
                ctx.lineTo(mps[i].x, mps[i].y)
            }
            lastX = mps[i].x
            lastY = mps[i].y
        }
    }
    dx = Math.abs(wire_ins.x2 - lastX)
    dy = Math.abs(wire_ins.y2 - lastY)
    if(dx>dy){
        ctx.lineTo(lastX, wire_ins.y2)
        ctx.lineTo(wire_ins.x2, wire_ins.y2)
    } else {
        ctx.lineTo(wire_ins.x2, lastY)
        ctx.lineTo(wire_ins.x2, wire_ins.y2)
    }
    ctx.stroke();
}

function checkWirePath(wire_ins, curX, curY){
    line_segments = []
    wirePath = new Path2D()
    mps = wire_ins.midpoints
    lastX = wire_ins.x1;
    lastY = wire_ins.y1;
    if(mps.length>0){
        for(i=0; i<mps.length;i++){
            dx = Math.abs(mps[i].x - lastX)
            dy = Math.abs(mps[i].y - lastY)
            if(dx>dy){
                line_segments.push({start: {x: lastX, y: lastY}, end: {x: lastX, y: mps[i].y}})
                line_segments.push({start: {x: lastX, y: mps[i].y}, end: {x: mps[i].x, y: mps[i].y}})
                //wire_path.lineTo(lastX, mps[i].y)
                //wire_path.lineTo(mps[i].x, mps[i].y)
            } else {
                line_segments.push({start: {x: lastX, y: lastY}, end: {x: mps[i].x, y: lastY}})
                line_segments.push({start: {x: mps[i].x, y: lastY}, end: {x: mps[i].x, y: mps[i].y}})
                //wire_path.lineTo(mps[i].x, lastY)
                //wire_path.lineTo(mps[i].x, mps[i].y)
            }
            lastX = mps[i].x
            lastY = mps[i].y
        }
    }
    dx = Math.abs(wire_ins.x2 - lastX)
    dy = Math.abs(wire_ins.y2 - lastY)
    if(dx>dy){
        line_segments.push({start: {x: lastX, y: lastY}, end: {x: lastX, y: wire_ins.y2}})
        line_segments.push({start: {x: lastX, y: wire_ins.y2}, end: {x: wire_ins.x2, y: wire_ins.y2}})
        //wire_path.lineTo(lastX, wire_ins.y2)
        //wire_path.lineTo(wire_ins.x2, wire_ins.y2)
    } else {
        line_segments.push({start: {x: lastX, y: lastY}, end: {x: wire_ins.x2, y: lastY}})
        line_segments.push({start: {x: wire_ins.x2, y: lastY}, end: {x: wire_ins.x2, y: wire_ins.y2}})
        //wire_path.lineTo(wire_ins.x2, lastY)
        //wire_path.lineTo(wire_ins.x2, wire_ins.y2)
    }

    for(i=0; i<line_segments.length; i++){
        var result = isOnLine(line_segments[i].start.x, line_segments[i].start.y, line_segments[i].end.x, line_segments[i].end.y, curX, curY, 10)
        if(result.status){
            return(result)
        }
    }
    return({status: false})
}

function makeWire(x1, y1, x2, y2, node){
    var wire = {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        midpoints: [],
        node: node
    }
    //wires.push(wire);
    return(wire);
}

function makeComponent(x, y, width, height, value, comp_type, nodes){ 
    var component = {
        x: x, 
        y: y, 
        width: width, 
        height: height,
        right: x+width, 
        bottom: y+height,
        comp_type: comp_type,
        nodes: nodes,
        value: value
    }
    //components.push(component);
    return(component);
}

function mapNodes(components, wires, node1, node2){
    for(var i=0; i<components.length; i++){
        for(var j=0; j<components[i].nodes.length; j++){
            if(components[i].nodes[j] == node2){
                components[i].nodes[j] = node1
            }
        }
    }
    for(var i=0; i<wires.length; i++){
        if(wires[i].node == node2){
            wires[i].node = node1
        }
    }
    return({components: components, wires: wires})
}

function isOnLine(initial_x, initial_y, endx, endy, pointx, pointy, tolerate) {
    if(initial_x == endx){
        if(Math.abs(pointx - initial_x)<=tolerate){
            if(Math.abs(pointy-initial_y)<=5){
                return({status: true, point: {x: initial_x, y:initial_y}})
            } else if(Math.abs(pointy-endy)<=5){
                return({status: true, point: {x: initial_x, y:endy}})
            } else if((pointy >= initial_y && pointy <= endy) || (pointy <= initial_y && pointy >= endy)){
                return({status: true, point: {x: initial_x, y:pointy}})

        } else {
            return({status: false})
        }
    }
    } else if(initial_y==endy){
        if(Math.abs(pointy - initial_y)<=tolerate){
            if(Math.abs(pointx-initial_x)<=tolerate){
                return({status: true, point: {x: initial_x, y:initial_y}})
            } else if(Math.abs(pointx-endx)<=tolerate){
                return({status: true, point: {x: endx, y:initial_y}})
            } else if((pointx >= initial_x && pointx <= endx) || (pointx <= initial_x && pointx >= endx)){
                return({status: true, point: {x: pointx, y:initial_y}})
            } else {
                return({status: false})
            }   
        }
    }
    return({status: false})
}

function zoom(dir){
    if(dir=='in'){
        scale = scale*1.1
        ctx.scale(1.1, 1.1)
    } else {
        scale = scale/1.1
        ctx.scale(1/1.1, 1/1.1)
    }
    drawCircuit()
}

function save(){
    let csrftoken = getCookie('csrftoken');
    if(typeof(cir_pk)=='undefined'){
        cir_pk='new'
    }
    console.log(cir_pk, components)
    let data = {pk: cir_pk, components: components, wires: wires};
    body = JSON.stringify(data)
    console.log(data)
    fetch("/canvas/save", {
        method: 'POST',
        body: body,
        headers: { "X-CSRFToken": csrftoken },
        credentials: 'same-origin',
    }).then(res => {
        location.href = res.url
        console.log(res)
    })
}

function load(pk){
    fetch("/canvas/load/"+pk.toString())
        .then(response => response.json())
        .then(data => {
            console.log(data)
            wires = data.wires
            components = data.components
            drawCircuit()
        });
}


function solve(){

    // add form input from hidden input elsewhere on the page
    let csrftoken = getCookie('csrftoken');
    if(domain == "dc"){
        body = JSON.stringify(components)
    } else if(domain=='ac'){
        body = JSON.stringify({frequency: frequency, components: components})
    }
    fetch("/canvas/solve", {
        method: 'POST',
        body: body,
        headers: { "X-CSRFToken": csrftoken },
        credentials: 'same-origin',
    }).then(res => {
        return res.json()
    }).then(data => {
        console.log(data)
        voltages = data.voltages
        currents = data.currents
        //drawCircuit()
    })
    /*
    fetch("/canvas/solve", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(components)
        */

}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}