//TO-DO: custom font, custom connector height, custom node gap,custorm margin

let nodeGapX = 50;
let offsetX = 40;
let offsetY = 40;
let fontSize = 14;
let offsetConnectorTop = 4;
let offsetConnectorBottom = 2;

let template = [
    {
        "text": "CP", "children": []
    }
];

let trig = [
    {
        "text": "VP", "children": [
            {
                "text": "V", "children": [
                    { "text": "put", "children": [] }
                ]
            },
            {
                //tree.dragged = null;
                "text": "NP", "trigChild": true, "children": [
                    { "text": "the book", "children": [] }
                ]
            },
        ]
    }
];

let data = [
    {
        "text": "CP", "children": [
            {
                "text": "C", "children": [
                    { "text": "T", "children": [{ "text": "might", "children": [] }] },
                    { "text": "+Q", "children": [] }
                ]
            },
            {
                "text": "TP", "children": [
                    {
                        "text": "NP", "children": [
                            {
                                "text": "Det", "children": [
                                    { "text": "that", "children": [] }
                                ]
                            },
                            {
                                "text": "N", "children": [
                                    { "text": "player", "children": [] }
                                ]
                            }
                        ]
                    },
                    { "text": "T'", "children": [] },
                ]
            }
        ]
    }
];

let renderTarget = data;

genId(renderTarget);
renderSVG(renderTarget);

function addNewChild(node) {
    node.trigChild = d3.event.shiftKey;
    node.children.push({ "text": "X", "children": [] });
}
function editText(node){
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
        .on("keypress", (item, index, element) => { //Press space to finish editing
            if (d3.event.keyCode === 32 || d3.event.keyCode === 13) {
                console.log(node);
                node.text = element[0].value;
                renderSVG(renderTarget);
                element[0].remove();
            }
        });
    activeInput.node().focus();
    //Click elsewhere to finish editing
    let input = d3.selectAll("input");
    d3.select("body").on("click", () => {
        console.log("clicked");
        let outsideInput = input.filter(() => this == d3.event.target).empty();
        if (outsideInput) {
            node.text = activeInput.node().value;
            renderSVG(renderTarget);
            activeInput.node().remove();
        }
    });
}
function toggleTrash() {
    d3.select("#trashCan")
        .classed("trash-open", !d3.select("#trashCan").classed("trash-open"))
}

function renderSVG(renderTarget) {
    let arrayForRender = flatten(renderTarget);
    renderNodes(".container", arrayForRender);
    let connectors = generateConnectors(arrayForRender);
    renderConnectors(".container", connectors);
    d3.selectAll("text").on("click", (node) => {
        if (d3.select("#trashCan").classed("trash-open")) {
            console.log(node);
            removeNode(node);
        }
        else {
            addNewChild(node);
        }
        genId(renderTarget);
        renderSVG(renderTarget);
        editText(_.last(node.children));
    })
        .on("contextmenu", function (node) {
            console.log(node);
            d3.event.preventDefault();
            editText(node);
        });
}

function genId(tree, prefix = "n") {
    let nodeCount = 0;
    let leafCount = 0;
    function recursive(subtree, depth, self) {
        subtree.forEach((item, index, arr) => {
            if (item.children.length == 0) {
                arr[index]["x"] = leafCount * nodeGapX;
                leafCount++;
            }
            arr[index].id = prefix + nodeCount;
            arr[index].parent = self;
            arr[index].y = depth * 40;
            nodeCount++;
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
    return oneDimensionArr;
}

function renderNodes(parent, dataArray) {
    let text = d3.select(parent)
        .selectAll("text")
        .data(dataArray)
        .attr("id", d => d.id)
        .text(d => d.text)
        .attr("x", d => d.x + offsetX)
        .attr("y", d => d.y + offsetY)
        .attr("text-anchor", "middle")
        .style("font-size", fontSize);

    text.enter()
        .append("text")
        .attr("id", d => d.id)
        .text(d => d.text)
        .attr("x", d => d.x + offsetX)
        .attr("y", d => d.y + offsetY)
        .attr("text-anchor", "middle")
        .style("font-size", fontSize);
    text.exit().remove();
}
function generateConnectors(dataArrayFlat) {
    let connectors = [];
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
                        "y2": child.y
                    }
                );
            }
        }
        );
    });
    return connectors;
}
function renderConnectors(parent, connectors) {
    let line = d3.select(parent)
        .selectAll("line")
        .data(connectors.filter(connector => connector.trig == false))
        .attr("x1", x => x["x1"] + offsetX)
        .attr("y1", x => x["y1"] + offsetY + offsetConnectorTop)
        .attr("x2", x => x["x2"] + offsetX)
        .attr("y2", x => x["y2"] + offsetY - fontSize - offsetConnectorBottom)
        .style("stroke-width", "1")
        .style("stroke", "rgb(0,0,0)")
    line.enter()
        .append("line")
        .attr("x1", x => x["x1"] + offsetX)
        .attr("y1", x => x["y1"] + offsetY + offsetConnectorTop)
        .attr("x2", x => x["x2"] + offsetX)
        .attr("y2", x => x["y2"] + offsetY - fontSize - offsetConnectorBottom)
        .style("stroke-width", "1")
        .style("stroke", "rgb(0,0,0)")
    line.exit().remove();
    //<polygon points="200,10 250,190 160,210" style="fill:lime;stroke:purple;stroke-width:1" />
    let polygon = d3.select(parent)
        .selectAll("polygon")
        .data(connectors.filter(connector => connector.trig == true))
        .attr("points", x => `${x.x1 + offsetX},${x.y1 + offsetY + offsetConnectorTop} ${x.x2 + offsetX},${x.y2 + offsetY - offsetConnectorBottom - fontSize} ${x.x3 + offsetX},${x.y3 + offsetY - offsetConnectorBottom - fontSize}`)
        .style("stroke-width", "1")
        .style("fill", "white")
        .style("stroke", "black")
    polygon.enter()
        .append("polygon")
        .attr("points", x => `${x.x1 + offsetX},${x.y1 + offsetY + offsetConnectorTop} ${x.x2 + offsetX},${x.y2 + offsetY - offsetConnectorBottom - fontSize} ${x.x3 + offsetX},${x.y3 + offsetY - offsetConnectorBottom - fontSize}`)
        .style("stroke-width", "1")
        .style("fill", "white")
        .style("stroke", "black")
    polygon.exit().remove();
}

function removeNode(node) {
    _.remove(node.parent.children, child => child.id == node.id)
}
 