<?php
    /*$chaptervar = $_GET['yearvar'];*/

    function updateChapterMenu() {
        $year_input = $_GET['yearvar'];

        $dir = "processed/";
        $year_path = $dir . $year_input . '/';

        // Open a directory, and read its contents
        if (is_dir($year_path)) {
            $all_chapters = scandir($year_path);
            echo json_encode($all_chapters);
        } else {
            echo json_encode(array());
        }
    };
    updateChapterMenu();
?>