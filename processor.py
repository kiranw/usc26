import os
import re
import subprocess
import json

# MASTER PLAN
# 1. Get files in directory
# 2. Find sections and split between lines, create new files in new dirs
# 3. Before generating file, parse out all xml and replace with only relevant html (that wont be part of diffs)
# 4. Create files for each year
# 5. Generate diffs between files
# ...Split sections into separate files for all years in a directory
# ...Get section title (split by symbol?)
# ...Locate "Amendments" sections
# ...Get Sections
# ...Parse into formatted list
# ...Store in Data Array


directory = "original_26"
target_directory = "processed"
target_diffs = "diffs"
display_directory = "display"



# HELPER FUNCTIONS

# Clean lines that are used to generate diffs (remove all HTML tags)
def clean_line(line):
	cleaned_line = line.strip()
	html_regex = re.compile(r'(<.*?>)')
	matches = re.findall(html_regex, cleaned_line)
	for match in matches:
		if match == line:
			return ""
		else:
			cleaned_line = cleaned_line.replace(match," ")
	return cleaned_line

# Join paths
def generate_path(dir_list):
	return "/Users/kiranwattamwar/Desktop/usc26/" + "/".join(dir_list)




def run_parser(limit_lines = True):
	if not os.path.exists(target_directory):
    		os.makedirs(target_directory)
	if not os.path.exists(display_directory):
    		os.makedirs(display_directory)

	for filename in os.listdir(directory):
		year = filename[0:4]
		if not os.path.exists(os.path.join(target_directory,year)):
			os.makedirs(os.path.join(target_directory,year))
		if not os.path.exists(os.path.join(display_directory,year)):
			os.makedirs(os.path.join(display_directory,year))

		filepath = os.path.join(directory,filename)
		raw_file = open(filepath, 'rb').readlines()

		chapter_start_regex = re.compile(r'<!-- itempath:.*?CHAPTER (\d+) -->')

		state = "prefix"
		prefix_analysis_file = open(os.path.join(target_directory,year,year+'_Prefix.html'), 'w')
		prefix_display_file = open(os.path.join(display_directory,year,year+'_Prefix.php'), 'w')
		current_analysis_file = prefix_analysis_file
		current_display_file = prefix_display_file
		written_lines = 0

		for line in raw_file:	
			write = False
			if state == "prefix" and "<!-- PDFPage:1 -->" in line:
				state = "intro"
			if state == "intro" and "<table " in line and ">Table 1<" in line:
				state = "table1"
			elif state == "intro":
				write = True
			
			# Get rid of the stuff in the table
			if state == "table1" and "</table>" in line:
				state = "intro"

			if state != "table1" and state != "intro":
				write = True

			# Transition from the Table into the first Chapter
			if re.match(chapter_start_regex,line):
				written_lines = 0
				if state == "intro":
					state = "chapter"
				new_chapter = chapter_start_regex.match(line).groups()[0]
				current_analysis_file.close()
				current_analysis_file = open(os.path.join(target_directory, year, str(year) + '_Chapter_' + new_chapter + '.html'), 'w')
				current_display_file.close()
				current_display_file = open(os.path.join(display_directory, year, str(year) + '_Chapter_' + new_chapter + '.php'), 'w')

			if write and written_lines <= 10000:
				written_lines += 1
				cleaned_line = clean_line(line)
				current_analysis_file.write(cleaned_line+'\n') 
				current_display_file.write(line) 




def generate_diffs():
	# Make a diff for every combination of years (consecutive) for each chapter in the code
	if not os.path.exists(os.path.join(target_directory, target_diffs)):
		os.makedirs(os.path.join(target_directory, target_diffs))

	for year in os.listdir(target_directory):
		if re.match(re.compile(r'(\d+)'),year):
			incremented_year = str(int(year)+1)
			for chapter in os.listdir(os.path.join(target_directory,year)):
				chapter_path = os.path.join(target_directory, target_diffs, chapter[5:])[:-5]
				new_file = str(incremented_year)+chapter[4:]
				if os.path.exists(os.path.join(target_directory,incremented_year,new_file)):
					if not os.path.exists(chapter_path):
						os.makedirs(chapter_path)
					target_patch = generate_path([target_directory,target_diffs,chapter[5:-5],year+"_"+incremented_year])
					print("diff exists",str(chapter),new_file)
					bashCommand = "git diff -U10000 --no-index -w " + generate_path([target_directory,year,chapter]) + " " + generate_path([target_directory,incremented_year,new_file]) + " > " + target_patch
					print bashCommand
					print subprocess.Popen(bashCommand, shell=True, stdout=subprocess.PIPE).stdout.read()




# Process the diff into html (php template?)
def patch_diffs():
	for chapter in os.listdir(os.path.join("processed", "diffs")):
		for diff in os.listdir(os.path.join("processed", "diffs", chapter)):
			year_1 = diff.split("_")[0]
			year_2 = diff.split("_")[1]

			if not os.path.exists(os.path.join("unified_display", year_1)):
				os.makedirs(os.path.join("unified_display", year_1))

			html_file = open(os.path.join("display", year_1, year_1 + "_" + chapter + ".php"), 'rb').readlines()
			diff_file = open(os.path.join("processed","diffs", chapter, diff), 'rb').readlines()
			new_file = open(os.path.join("unified_display", year_1, year_1 + "_" + chapter + ".php"), 'w')

			span_add_open = "<span class='diff-green'>"
			span_remove_open = "<span class='diff-red'>"
			span_close = "</span>"
			prev_tag_open = ""
			prev_tag_close = ""
			prev_class = ""

			# Condition: the HTML file will always be equal to or lagging behind the diff file
			html_index = 0
			diff_index = 5 # first 5 lines are metadata from git diffing
			while html_index < len(html_file):
				if diff_index >= len(diff_file):
					new_file.write(html_file[html_index].strip())
					html_index += 1
					continue

				html_line = html_file[html_index].strip()
				diff_line = diff_file[diff_index].replace('\n','').strip()
				clean_html = clean_line(html_line).strip()

				if html_line == "<!-- itempath:/260/Subtitle A/CHAPTER 1/Subchapter A/PART I/Sec. 1 -->":
					print("appending anchor")
					new_file.write("<div id='visualization-anchor'></div>")

				if re.compile(r'(<.*?>)').match(html_line) and len(re.compile(r'(<.*?>)').match(html_line).groups()) > 1:
					prev_tag_open = re.compile(r'(<.*?>)').match(html_line).groups()[0]
					prev_tag_close = re.compile(r'(<.*?>)').match(html_line).groups()[-1]

				# Lines are the same
				if clean_html.replace(' ','') == diff_line.replace(' ',''):
					html_index += 1
					new_file.write(html_line)

				elif len(diff_line) > 0 and diff_line[0] == "-":
					if diff_line[2:].replace(' ','') in clean_html.replace(' ',''):
						html_index += 1
						end_open_tag = html_line.find(">")+1
						begin_close_tag = html_line.rfind("</")
						new_html_line = html_line[0:end_open_tag] + span_remove_open + html_line[end_open_tag:begin_close_tag] + span_close + html_line[begin_close_tag:]
						new_file.write(new_html_line)
				elif len(diff_line) > 0 and diff_line[0] == "+":
					new_html_line = span_add_open + diff_line[2:] + span_close
					new_file.write(new_html_line+"<br>")

				else:
					# Something is wrong
					pass

				diff_index += 1
			new_file.close()




def analyze_diffs():
	# Perform an analysis over diffed sections (identify their chapter number and line number) for closeness metric
	# Go through each chapter
	# Within each chapter, can I identify a cluster of lines that changes consistently year to year 
	# Is the thing changing a number?
		# Is it a datetime or a float
		# Construct a row of data, and an associated line number 
		# HTML diff should have an anchor inserted in it with same ID or something
		# Create a renderable html php template with anchors, and 2-axis data that is associated with it
	# for chapter in os.listdir(os.path.join("processed_2", target_diffs)):
	# 	recurring_lines = []
	# 	if re.match(re.compile(r'(.+).html'), chapter):
	# 		all_diffs = sorted(os.listdir(os.path.join("processed_2", target_diffs,chapter)))
	# 		diff_lineages = []
	pass






# run_parser()
# generate_diffs()
patch_diffs()


