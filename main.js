let nodeGapX = 50;
let offsetX = 40;
let offsetY = 40;
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

genId(data);
let arrayForRender = dimensionSquash(data);
renderNodes(".container", arrayForRender);
let connectors = generateConnectors(arrayForRender);
renderConnectors(".container", connectors);


function genId(tree, prefix = "n") {
    let nodeCount = 0;
    let leafCount = 0;
    function recursive(subtree, depth) {

        subtree.forEach((item, index, arr) => {
            if (item.children.length == 0) {
                arr[index]["x"] = leafCount * nodeGapX;
                leafCount++;
            }
            arr[index].id = prefix + nodeCount;
            arr[index].y = depth * 40;
            nodeCount++;
            recursive(item.children, depth + 1);
        });
    }
    function computeX(node) {
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
function dimensionSquash(data) {
    let oneDimensionArr = [];
    function recurse(subtree) {
        subtree.forEach((value) => {
            oneDimensionArr.push(value);
            recurse(value.children);
        });
    }
    recurse(data);
    return oneDimensionArr;
}

function renderNodes(parent, dataArray) {
    d3.select(parent)
        .selectAll("text")
        .data(dataArray)
        .enter()
        .append("text")
        .attr("id", d => d.id)
        .text(d => d.text)
        .attr("x", d => d.x + offsetX)
        .attr("y", d => d.y + offsetY)
        .attr("text-anchor", "middle")
        .attr("v-model", "type")
    //TO-DO: custom font, custom connector height, custom node gap,custorm margin

}
function generateConnectors(dataArrayFlat) {
    let connectors = [];
    dataArrayFlat.forEach(parent => {
        parent.children.forEach(child => {
            connectors.push(
                {
                    "x1": parent.x,
                    "y1": parent.y,
                    "x2": child.x,
                    "y2": child.y
                }
            );
        }
        );
    });
    return connectors;
}
function renderConnectors(parent, connectors) {
    d3.select(parent)
        .selectAll("line")
        .data(connectors)
        .enter()
        .append("line")
        .attr("x1", x => x["x1"] + offsetX)
        .attr("y1", x => x["y1"] + offsetY + 2)
        .attr("x2", x => x["x2"] + offsetX)
        .attr("y2", x => x["y2"] + offsetY - 14)
        .style("stroke-width", "1")
        .style("stroke", "rgb(0,0,0)")
}