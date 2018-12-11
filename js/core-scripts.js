function toggleHierarchy(){
    /* to toggle the navigation sidebar, just switch the CSS classes */
    $("#main-vis-hierarchy").toggleClass("collapsed");
    $("#main-vis-container").toggleClass("col-md-12 col-md-11");
}

function toggleGraphs(){
    $("#main-vis-graphs").toggle();
}

function fixHeights(){
    height = screen.height - $("#navbar").height() - $("#breadcrumbs").height() - $("#time-explorer").height() - $("#footer").height() - 220;

    $("#main-vis-hierarchy").height(height);
    $("#main-vis-diffs").height(height);
    $("#main-vis-graphs").height(height);
}

var sectionName = "26";
var srcDirectory = "../processed";
var currentYear = "2017";
var currentChapter = "Chapter_1";
var currentFile = "2017\/2017_Chapter_1.html";
var currentChapterIndex = "1";

var years = ["1997","1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017"];

function initialize(){
    // Need a list of years given the current section
    // Need a list of chapters given the current year
        // Plot the chapters as links on the left panel
        // Plot the years on the lower time explorer
        // Vertical dimension of time explorer can be number of changes between years on the chapter you're looking at (lines changed)
    fixHeights();
    generate_time_explorer();
    updateYear("1997");
    generateChapter1Vis();
    $("#graph-visualization-container").hide();
}

function generate_time_explorer(){
    var parseTime = d3.timeParse("%Y");
    var formatTime = d3.timeFormat("%Y");
    yearsData = years.map(function(d){ return parseTime(d.toString());});

    width = screen.width;
    height = 80;
    var margin = {top: 0.05*height, right: 0.1*width, bottom: 0.05*height, left: 0.1*width},
        width = screen.width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    var svg = d3.select("#time-explorer-d3-container")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

    // set the ranges
    var x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(yearsData, function(d) { return d; }));

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1]);

    var valueline = d3.line()
        .x(function(d) { return x(d); })
        .y(function(d){ return y(0.5); });

    svg.selectAll(".time-explorer-dot")
        .data(yearsData)
        .enter().append("circle")
        .attr("class","time-explorer-dot")
        .attr("r", 10)
        .attr("id", function(d) { return "time-"+ formatTime(d); })
        .attr("cx", function(d) { return x(d); })
        .attr("cy", function(d) { return y(0.5); })
        .on("mouseover", mouseoverCircle)
        .on("mouseout", mouseoutCircle)
        .on("click", mouseclickCircle);

    // Add the valueline path.
    svg.append("path")
        .attr("class","d3-general")
        .data(yearsData)
        .attr("class", "time-explorer-line")
        .attr("d", valueline);

    // Add the X Axis
    svg.append("g")
        .attr("class","d3-general")
        .attr("transform", "translate(0," + height*0.6 + ")")
        .call(d3.axisBottom(x).ticks(years.length));

    // // Add the Y Axis
    // svg.append("g")
    //     .call(d3.axisLeft(y));

}


function mouseoverCircle(d, i) {
    d3.select(this)
        .transition()
        .duration(300)
        .attr("r",15)
}

function mouseoutCircle(d, i) {
    d3.select(this)
        .transition()
        .duration(300)
        .attr("r",10)
}

function mouseclickCircle(d, i) {
    d3.select("#time-"+currentYear)
        .attr("class", "time-explorer-dot");

    d3.select(this)
        .transition()
        .duration(300)
        .attr("class","time-explorer-selected-dot time-explorer-dot");

    updateYear(this.id.substr(this.id.length - 4))
}

function updateYear(year){
    currentYear = year;
    $("#currentYear").value = year;

    // call updateYear function in PHP and pass the year, chapter to that AJAX function
    jQuery.ajax({
        type: "GET",
        url: 'updateYear.php',
        dataType: 'json',
        data: {yearvar: currentYear},
        contentType: "application/json",
        success: function (data, status) {
            processYears(data);
        }
    });
}

function processYears(yearData){
    yearData = yearData.filter(function(chapter){
                return chapter.substr(chapter.length-5) === ".html" })
        .map(function(chapter){
            chapter = chapter.substring(4,chapter.length-5).split("_").join(" ").trim();
            chapter = chapter.charAt(0).toUpperCase() + chapter.slice(1);
            return chapter;
        });
    yearData.sort(function(a,b) {
        if (a == "Prefix"){
            return -1;
        }
        if (b == "Prefix"){
            return 1;
        }
        return parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]);
    });
    yearData = yearData.map(function(chapterName){
        return "<a onclick='processChapter(" + '"' + chapterName.split(" ").join("_") + '"' +
        ");' class='chapter' id='" + chapterName.split(" ").join("_") + "'>" + chapterName + "</a>";
    });
    $("#main-vis-hierarchy").html(yearData.join("<br>"));
    processChapter("Chapter_1");
}


// Pass in "Chapter_38" or "Prefix"
function processChapter(chapter_name){

    $("#main-vis-diffs").html("<img src='img/loading_tmp.gif' id='loading-gif' />");

    // Clean out the old display
    if (currentChapterIndex == "0"){
        $("#Prefix").removeClass("chapter-selected");
    }
    else {
        $("#Chapter_"+currentChapterIndex).removeClass("chapter-selected");
    }

    // Fix up the new indexing data
    currentChapterName = currentChapter;
    currentChapter = chapter_name;
    if (chapter_name == "Prefix"){
        currentChapterIndex = "0";
    }
    else {
        currentChapterIndex = chapter_name.split("_")[1];
    }
    $("#"+currentChapter).addClass("chapter-selected");

    $("#chapter1-circle").hide();
    if (currentChapterIndex == 1){
        $("#chapter1-circle").show();
    }

    requestYear = currentYear;
    if (requestYear != 1997){
        requestYear -=1 ;
    }

    // Request for the new file information to display
    jQuery.ajax({
        type: "GET",
        url: 'updateChapter.php',
        dataType: 'json',
        data: {year: requestYear, currentChapterName: currentChapterName},
        contentType: "application/json",
        success: function (data, status) {
            displaySelectedChapter(data);
        }
    });
}

function displaySelectedChapter(data){
    $("#main-vis-diffs").html(data);
    fixHeights();
}

function launchChapter1(){
    $("#graph-visualization-container").show();
}

function toggleVisualizationContainer() {
    $("#graph-visualization-container").toggle();
}

$(document).keyup(function(e) {
    if (e.key === "Escape") {
        $("#graph-visualization-container").hide();
    }
});


function generateChapter1Vis(){
    var data = [
        {
            name: "USA",
            values: [
                {date: "2000", price: "100"},
                {date: "2001", price: "110"},
                {date: "2002", price: "145"},
                {date: "2003", price: "241"},
                {date: "2004", price: "101"},
                {date: "2005", price: "90"},
                {date: "2006", price: "10"},
                {date: "2007", price: "35"},
                {date: "2008", price: "21"},
                {date: "2009", price: "201"}
            ]
        },
        {
            name: "Canada",
            values: [
                {date: "2000", price: "200"},
                {date: "2001", price: "120"},
                {date: "2002", price: "33"},
                {date: "2003", price: "21"},
                {date: "2004", price: "51"},
                {date: "2005", price: "190"},
                {date: "2006", price: "120"},
                {date: "2007", price: "85"},
                {date: "2008", price: "221"},
                {date: "2009", price: "101"}
            ]
        },
        {
            name: "Maxico",
            values: [
                {date: "2000", price: "50"},
                {date: "2001", price: "10"},
                {date: "2002", price: "5"},
                {date: "2003", price: "71"},
                {date: "2004", price: "20"},
                {date: "2005", price: "9"},
                {date: "2006", price: "220"},
                {date: "2007", price: "235"},
                {date: "2008", price: "61"},
                {date: "2009", price: "10"}
            ]
        }
    ];

    var width = $("#chapter1-visualization").width();
    var height = $("#chapter1-visualization").height() - 100;
    var margin = 50;
    var duration = 250;

    var lineOpacity = "0.25";
    var lineOpacityHover = "0.85";
    var otherLinesOpacityHover = "0.1";
    var lineStroke = "3px";
    var lineStrokeHover = "6px";

    var circleOpacity = '0.85';
    var circleOpacityOnLineHover = "0.25";
    var circleRadius = 3;
    var circleRadiusHover = 6;


    /* Format Data */
    var parseDate = d3.timeParse("%Y");
    data.forEach(function(d) {
        d.values.forEach(function(d) {
            d.date = parseDate(d.date);
            d.price = +d.price;
        });
    });


    /* Scale */
    var xScale = d3.scaleTime()
        .domain(d3.extent(data[0].values, function(d){ return d.date; }))
        .range([0, width-margin]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data[0].values, function(d){ return d.price; })])
        .range([height-margin, 0]);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    /* Add SVG */
    var svg = d3.select("#chapter1-visualization").append("svg")
        .attr("width", (width+margin)+"px")
        .attr("height", (height+margin)+"px")
        .append('g')
        .attr("transform", 'translate('+(margin)+','+margin+')');


    /* Add line into SVG */
    var line = d3.line()
        .x(function(d){ return xScale(d.date); })
        .y(function(d){ return yScale(d.price); });

    lines = svg.append('g').attr('class', 'lines');

    lines.selectAll('.line-group')
        .data(data).enter()
        .append('g')
        .attr('class', 'line-group')
        .on("mouseover", function(d, i) {
            svg.append("text")
                .attr("class", "title-text")
                .style("fill", color(i))
                .text(d.name)
                .attr("text-anchor", "middle")
                .attr("x", (width-margin)/2)
                .attr("y", 5);
        })
        .on("mouseout", function(d) {
            svg.select(".title-text").remove();
        })
        .append('path')
        .attr('class', 'line')
        .attr('d', function(d){ return line(d.values); })
        .style('stroke', function(d, i){ return color(i);} )
        .style('opacity', lineOpacity)
        .on("mouseover", function(d) {
            d3.selectAll('.line')
                .style('opacity', otherLinesOpacityHover);
            d3.selectAll('.circle')
                .style('opacity', circleOpacityOnLineHover);
            d3.select(this)
                .style('opacity', lineOpacityHover)
                .style("stroke-width", lineStrokeHover)
                .style("cursor", "pointer");
        })
        .on("mouseout", function(d) {
            d3.selectAll(".line")
                .style('opacity', lineOpacity);
            d3.selectAll('.circle')
                .style('opacity', circleOpacity);
            d3.select(this)
                .style("stroke-width", lineStroke)
                .style("cursor", "none");
        });


    /* Add circles in the line */
    lines.selectAll("circle-group")
        .data(data).enter()
        .append("g")
        .style("fill", function(d, i){ return color(i); })
        .selectAll("circle")
        .data(function(d){ return d.values; }).enter()
        .append("g")
        .attr("class", "circle")
        .on("mouseover", function(d) {
            d3.select(this)
                .style("cursor", "pointer")
                .append("text")
                .attr("class", "text")
                .text(d.price)
                .attr("x", function(d){ return xScale(d.date) + 5;} )
                .attr("y", function(d){ return yScale(d.price) - 10; });
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .style("cursor", "none")
                .transition()
                .duration(duration)
                .selectAll(".text").remove();
        })
        .append("circle")
        .attr("cx", function(d){ return xScale(d.date); })
        .attr("cy", function(d){ return yScale(d.price); })
        .attr("r", circleRadius)
        .style('opacity', circleOpacity)
        .on("mouseover", function(d) {
            d3.select(this)
                .transition()
                .duration(duration)
                .attr("r", circleRadiusHover);
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .transition()
                .duration(duration)
                .attr("r", circleRadius);
        })
        .on("click", function(d){
            $("#chapter1-difftext").html(d.price);
        });


    /* Add Axis into SVG */
    var xAxis = d3.axisBottom(xScale).ticks(5);
    var yAxis = d3.axisLeft(yScale).ticks(5);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", 'translate(0, ' + (height-margin) + ')')
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append('text')
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .attr("fill", "#000")
        .text("Total values");
}