import {template, example} from './example.js';
//global variables
let connectors = [];
let nodes = [];
let offsetX = 40;
let offsetY = 40;
let fontSize = 14;
let offsetConnectorTop = 4;
let offsetConnectorBottom = 2;

//variables for drag()
let nodesDOMElements;
let nodesToBeMoved;
let connectorsToBeMoved;
let connectorsDOMElements;
let nodesNotMoved;

//svg containder
let svg = d3.select(".svg-container");
let drag = d3.drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded);
let renderTarget = example;

function addNewChild(node) {
    node.trigChild = d3.event.shiftKey;
    node.children.push({ "text": "X", "children": [] });
}

function editText(node) {
    let boundingRect = document.getElementById(node.id).getBoundingClientRect();
    let activeInput = d3.select('#textEdit')
        .append("input")
        .classed("overlay-input", true)
        .attr("type", "text")
        .attr("value", node.text)
        .style("color", "red")
        .style("background", "white")
        .style("font-size", fontSize + "px")
        .style("left", boundingRect.left + "px")
        .style("top", boundingRect.top + "px")
        .style("width", "80px")
        .on("keypress", (item, index, element) => { //Press space to finish editing
            if (d3.event.keyCode === 32 || d3.event.keyCode === 13) {

                node.text = element[0].value;
                renderSVG(renderTarget);
                element[0].remove();
            }
        });
    activeInput.node().focus();
    //Click elsewhere to finish editing
    let input = d3.selectAll("input");
    d3.select("body").on("click", () => {
        let outsideInput = input.filter(() => this == d3.event.target).empty();
        if (outsideInput) {
            node.text = activeInput.node().value;
            renderSVG(renderTarget);
            activeInput.node().remove();
        }
    });
}

function renderSVG(renderTarget, size) {
    nodes = flatten(renderTarget);

    if (size) {
        svg
            .style("width", size[0] + "px")
            .style("height", size[1] + "px");
    }
    renderNodes(svg, nodes);
    connectors = generateConnectors(nodes);
    renderConnectors(svg, connectors);
    d3.selectAll("text").on("click", (node) => {
        if (d3.select("#trashCan").classed("trash-open")) {
            removeNode(node);
        }
        else {
            if (node.children.length == 2) return;
            addNewChild(node);
        }

        let newSize = genId(renderTarget);
        renderSVG(renderTarget, newSize);
        //editText(_.last(node.children));
    })
        .on("contextmenu", function (node) {

            d3.event.preventDefault();
            editText(node);
        });



}

//generate ID for each node
function genId(tree, prefix = "n") {
    let nodeGapX = 50;
    let leafCount = 0;
    let nodeCount = 0;
    let maxX = 0, maxY = 0;
    function recursive(subtree, depth, self) {
        subtree.forEach((item, index, arr) => {
            if (item.children.length == 0) {
                arr[index]["x"] = leafCount * nodeGapX;
                maxX = (arr[index]["x"] > maxX) ? arr[index]["x"] : maxX;
                leafCount++;
            }

            //if (!("id" in item)) {
            arr[index].id = prefix + nodeCount;
            arr[index].nid = nodeCount;
            nodeCount++;
            //}
            arr[index].parent = self;
            arr[index].y = depth * 40;
            maxY = (arr[index].y > maxY) ? arr[index].y : maxY;
            recursive(item.children, depth + 1, item);
        });
    }
    function computeX(node) { //compute the (_,y) position of a node
        if (node.children.length == 0) {
            return node.x;
        }
        let sum = 0;
        node.children.forEach((item, index, arr) => {
            sum += computeX(item);
        })

        let x = sum / node.children.length;
        node["x"] = x;
        return x;
    }

    recursive(tree, 0);
    computeX(tree[0]);
    return [maxX + 2 * offsetX, maxY + 2 * offsetY];
}
function flatten(renderTarget) {
    let oneDimensionArr = [];
    function recurse(subtree) {
        subtree.forEach((value) => {
            oneDimensionArr.push(value);
            recurse(value.children);
        });
    }
    recurse(renderTarget);
    return oneDimensionArr
}

function renderNodes(svg, dataArray) {
    let text = svg
        .selectAll("text")
        .data(dataArray)
        .call(drag)
    text.text(d => d.text)
        .attr("x", d => d.x + offsetX)
        .attr("y", d => d.y + offsetY)
        .attr("text-anchor", "middle")
        .style("font-size", fontSize + 'px');

    text.enter()
        .append("text")
        .call(drag)
        .attr("id", d => d.id)
        .text(d => d.text)
        .attr("x", d => d.x + offsetX)
        .attr("y", d => d.y + offsetY)
        .attr("text-anchor", "middle")
        .style("font-size", fontSize + 'px');

    text.exit().remove();
}
function generateConnectorsToBeMoved(dataArrayFlat) {
    let dataIds = _.map(dataArrayFlat, (data) => data.id);

    let connectorsToBeMoved = _.filter(connectors, (connector) => {
        return dataIds.includes(connector.parent);
    });
    return connectorsToBeMoved;
}

function generateConnectors(dataArrayFlat) {
    let connectors = [];
    let connectorCount = 0;
    dataArrayFlat.forEach(parent => {
        parent.children.forEach(child => {
            if (parent.trigChild) {
                let halfChildTextWidth = (document.getElementById(child.id).getBBox().width) / 2;
                connectors.push(
                    {
                        "trig": true,
                        "x1": parent.x,
                        "y1": parent.y,
                        "x2": child.x - halfChildTextWidth,
                        "y2": child.y,
                        "x3": child.x + halfChildTextWidth,
                        "y3": child.y,
                        "id": "c" + connectorCount,
                        "parent": parent.id
                    }
                );
            }
            else {
                connectors.push(
                    {
                        "trig": false,
                        "x1": parent.x,
                        "y1": parent.y,
                        "x2": child.x,
                        "y2": child.y,
                        "id": "c" + connectorCount,
                        "parent": parent.id
                    }
                );
            }
            connectorCount++;
        }
        );
    });
    return connectors;
}
function renderConnectors(svg, connectors) {
    let line = svg
        .selectAll("line")
        .data(connectors.filter(connector => connector.trig == false))

    line
        .attr("x1", x => x["x1"] + offsetX)
        .attr("y1", x => x["y1"] + offsetY + offsetConnectorTop)
        .attr("x2", x => x["x2"] + offsetX)
        .attr("y2", x => x["y2"] + offsetY - fontSize - offsetConnectorBottom)
        .style("stroke-width", "1")
        .style("stroke", "rgb(0,0,0)")
        .attr("id", x => x.id)
    line.enter()
        .append("line")
        .attr("x1", x => x["x1"] + offsetX)
        .attr("y1", x => x["y1"] + offsetY + offsetConnectorTop)
        .attr("x2", x => x["x1"] + offsetX)
        .attr("y2", x => x["y1"] + offsetY + offsetConnectorTop)
        /*         .transition()
                .duration(500) */
        .attr("x2", x => x["x2"] + offsetX)
        .attr("y2", x => x["y2"] + offsetY - fontSize - offsetConnectorBottom)
        .style("stroke-width", "1")
        .style("stroke", "rgb(0,0,0)")
        .attr("id", x => x.id)
    line.exit().remove();
    //<polygon points="200,10 250,190 160,210" style="fill:lime;stroke:purple;stroke-width:1" />
    let polygon = svg
        .selectAll("polygon")
        .data(connectors.filter(connector => connector.trig == true))
        .attr("points", x => `${x.x1 + offsetX},${x.y1 + offsetY + offsetConnectorTop} ${x.x2 + offsetX},${x.y2 + offsetY - offsetConnectorBottom - fontSize} ${x.x3 + offsetX},${x.y3 + offsetY - offsetConnectorBottom - fontSize}`)
        .style("stroke-width", "1")
        .style("fill", "white")
        .style("stroke", "black")
        .attr("id", x => x.id)
    polygon.enter()
        .append("polygon")
        .attr("points", x => `${x.x1 + offsetX},${x.y1 + offsetY + offsetConnectorTop} ${x.x2 + offsetX},${x.y2 + offsetY - offsetConnectorBottom - fontSize} ${x.x3 + offsetX},${x.y3 + offsetY - offsetConnectorBottom - fontSize}`)
        .style("stroke-width", "1")
        .style("fill", "white")
        .style("stroke", "black")
        .attr("id", x => x.id)
    polygon.exit().remove();
}

function removeNode(node) {
    _.remove(node.parent.children, child => child.id == node.id)
}


function dragStarted(node) {
    if (!node.parent) return;
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
    nodesToBeMoved = flatten([node]);
    connectorsToBeMoved = generateConnectorsToBeMoved(nodesToBeMoved);

    nodesDOMElements = _.map(nodesToBeMoved, (node) => document.getElementById(node.id));
    connectorsDOMElements = _.map(connectorsToBeMoved, (connector) => document.getElementById(connector.id));

    nodesNotMoved = _.filter(nodes, (node) => {
        return !nodesToBeMoved.includes(node);
    });

}

function dragged(node) {
    if (!node.parent) return;

    let snapTarget = _.find(nodesNotMoved, (node) => {
        let distance = Math.sqrt(Math.pow(node.x - d3.event.x, 2) + Math.pow(node.y - d3.event.y, 2));
        return distance < 10; //minimum distance to snap
    });
    if (snapTarget) {
        d3.select('#' + snapTarget.id)
            .style("font-size", '20px')
    }
    else {
        d3.selectAll('text')
            .style("font-size", fontSize + 'px')
    }
    d3.selectAll(nodesDOMElements)
        .data(nodesToBeMoved)
        .attr("x", (thisNode) => {
            let xDiff = node.x - thisNode.x;
            return d3.event.x - xDiff + offsetX;
        })
        .attr("y", (thisNode) => {
            let yDiff = node.y - thisNode.y;
            return d3.event.y - yDiff + offsetY;
        });
    
    let moveOffsetX = d3.event.x - node.x;
    let moveOffsetY = d3.event.y - node.y;
    
    d3.selectAll(connectorsDOMElements.filter(connector => connector.tagName == 'line'))
        .data(connectorsToBeMoved.filter(connector => connector.trig == false))
        .attr("x1", (thisConnector) => moveOffsetX +thisConnector.x1 + offsetX)
        .attr("y1", (thisConnector) => moveOffsetY + thisConnector.y1 + offsetY + offsetConnectorTop)
        .attr("x2", (thisConnector) => moveOffsetX +thisConnector.x2 + offsetX)
        .attr("y2", (thisConnector) => moveOffsetY + thisConnector.y2 + offsetY - fontSize - offsetConnectorBottom);
    d3.selectAll(connectorsDOMElements.filter(connector => connector.tagName == 'polygon'))
        .data(connectorsToBeMoved.filter(connector => connector.trig == true))
        .attr("points", x => {
            return `${x.x1 + offsetX + moveOffsetX}, ${x.y1 + offsetY + offsetConnectorTop + moveOffsetY} 
        ${x.x2 + offsetX + moveOffsetX}, ${x.y2 + offsetY - offsetConnectorBottom - fontSize + moveOffsetY}
        ${x.x3 + offsetX + moveOffsetX}, ${x.y3 + offsetY - offsetConnectorBottom - fontSize + moveOffsetY}`})
}

function dragEnded(node) {
    if (!node.parent) return;

    d3.select(this).classed("dragging", false);
    let switchTarget = _.find(nodesNotMoved, (node) => {
        let distance = Math.sqrt(Math.pow(node.x - d3.event.x, 2) + Math.pow(node.y - d3.event.y, 2));
        return distance < 10; //minimum distance to snap
    });
    if (switchTarget && switchTarget.parent) {
        let switchTargetIndex = _.indexOf(switchTarget.parent.children, switchTarget);
        let nodeIndex = _.indexOf(node.parent.children, node);
        switchTarget.parent.children[switchTargetIndex] = node;
        node.parent.children[nodeIndex] = switchTarget;
        [node.parent, switchTarget.parent] = [switchTarget.parent, node.parent];
    }
    let newSize = genId(renderTarget);
    renderSVG(renderTarget, newSize);
}
function exportToSVG() {
    let url = URL.createObjectURL(newSVGBlob());
    let downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "export.svg";
    downloadLink.click();
}
function exportToPNG(transparent) {
    let url = window.URL.createObjectURL(newSVGBlob());
    let image = new Image();
    image.src = url;
    let canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");

    size = genId(renderTarget);
    canvas.height = size[1];
    canvas.width = size[0];

    if (!transparent) {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    image.onload = function () {
        context.drawImage(image, 0, 0);
        let downloadLink = document.createElement("a");
        downloadLink.download = "export.png";
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.click();
    };


}

function newSVGBlob() {
    let source = (new XMLSerializer()).serializeToString(svg.node());
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    return new Blob([source], { type: "image/svg+xml;charset=utf-8" });
}

function clearEverything() {
    renderTarget = template;
    let newSize = genId(renderTarget);
    renderSVG(renderTarget, newSize);
}


export {renderSVG,
    genId,
    renderTarget,
    exportToSVG,
    exportToPNG,
    clearEverything
};
