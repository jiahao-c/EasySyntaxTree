//TO-DO: custom font, custom connector height, custom node gap,custorm margin
//TO-DO: export to json
import 'modules/draw.js';
import { renderTarget, 
    renderSVG,
    genId,
    exportToSVG,
    exportToPNG,
    clearEverything} from 'modules/draw.js';
let newSize = genId(renderTarget);
renderSVG(renderTarget, newSize);

//UI:

function alertPNG() {
    $('#alertPNG').modal('show');
}

function showHelp() {
    $('#help').modal('show');
}

d3.select("#trash").on('click', () => {
    d3.select("#trashCan")
    .classed("trash-open", !d3.select("#trashCan").classed("trash-open"))
});

$('#PNGfalse').click(()=>exportToPNG(false))
$('#PNGtrue').click(()=>exportToPNG(true))
$('#click').click(clearEverything)
$('#svg').click(exportToSVG)
$('#png').click(alertPNG)
