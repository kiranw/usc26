<?php
    function updateDiffText() {
        $year = $_GET['year'];
        $chap = $_GET['currentChapterName'];
        $filename = 'unified_display/' . $year . "/" . $year . "_" . $chap . '.php';
        echo json_encode(file_get_contents($filename));
    };
    updateDiffText();
?>