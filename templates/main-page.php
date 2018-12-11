<?php
?>

<div class="container">
    <div class="" id="main-content">
        <div class="row" id="breadcrumbs">
            <div>United States Code > Title 26 Internal Revenue Code > Article 1 > Chapter 1</div>
            <div class="row">
                <div class="btn-toggle" onclick="toggleHierarchy();">Toggle Chapter Explorer</div>
                <div class="btn-toggle" onclick="toggleGraphs();">Toggle Graphs</div>
            </div>
        </div>

        <form id="currentSelectionsForm" action="" method="post">
            <input id="currentYear" type="hidden" name="currentYear" value="2017" >
            <input id="currentChapter" type="hidden" name="currentChapter" value="prefix" >
        </form>

        <div class="row" id="main-vis">
            <div class="col-md-2" id="main-vis-hierarchy">
            </div>

            <div class="col-md-10 row" id="main-vis-container">
                <div class="col-md-10">
                    <div id="main-vis-diffs"></div>
                </div>
                <div class="col-md-2" id="main-vis-graphs">
                    <div id="chapter1-graphs">
                        <div id="chapter1-circle" onclick="launchChapter1();"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row" id="time-explorer">
            <div class="" id="time-explorer-d3-container"></div>
        </div>
    </div>
</div>

<div id="graph-visualization-container">
    <div id="chapter-1-visualization-container">
        <div id="graph-visualization-close" onclick="toggleVisualizationContainer();">x</div>
        <hr>
        <div id="chapter1-visualization">
        </div><br>
        <div id="chapter1-difftext">TestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTest</div>
    </div>
    <div class="dark-background"></div>
</div>
