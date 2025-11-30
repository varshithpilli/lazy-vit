let view_attendance_page = () => {
	let table_head = document.getElementsByTagName("thead")[0].children[0].children;
	let attendance_calc = table_head[0].cloneNode(true);
	attendance_calc.innerText = "75% Attendance Alert";
	table_head[11].insertAdjacentElement("afterend", attendance_calc);
	table_head[0].style.display = "none";
	table_head[13].style.display = "none";
	table_head[6].style.display = "none";
	
	let body = document.getElementsByTagName("tbody");
	let body_row = body[0].querySelectorAll("tr");
	body_row.forEach((row) => {
		row.children[0].style.display = "none";
		row.children[6].style.display = "none";
		row.children[12].style.display = "none";


		let new_Table_Content = row.innerHTML.split("\n");
		if (row.childNodes.length > 3) {
			let attended_classes, tot_classes, course_type;
			if (document.location.href.includes("vtop.vit")) {
				attended_classes = parseFloat(row.childNodes[11].innerText);
				tot_classes = parseFloat(row.childNodes[13].innerText);
				course_type = row.childNodes[5].innerText;
			} else if (document.location.href.includes("vtopcc")) {
				attended_classes = parseFloat(row.childNodes[19].innerText);
				tot_classes = parseFloat(row.childNodes[21].innerText);
				course_type = row.childNodes[7].innerText;
			}
			let new_table_content_splice = document.location.href.includes("vtopcc")
				? 29
				: 37;

			if (attended_classes / tot_classes < 0.7401) {
				let req_classes = Math.ceil(
					(0.7401 * tot_classes - attended_classes) / 0.2599
				);

				if (course_type.includes("Lab")) {
					req_classes /= 2;
					req_classes = Math.ceil(req_classes);
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: rgb(238, 75, 43,0.7);"><p style="margin: 0px;">-${req_classes}</p></td>`
					);
					row.innerHTML = new_Table_Content.join("");
				} else {
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: rgb(238, 75, 43,0.7);"><p style="margin: 0px;">-${req_classes}</p></td>`
					);
					row.innerHTML = new_Table_Content.join("");
				}
			} else {
				let bunk_classes = Math.floor(
					(attended_classes - 0.7401 * tot_classes) / 0.7401
				);

				let color = "rgb(170, 255, 0,0.7)";
				if (
					0.7401 <= attended_classes / tot_classes &&
					attended_classes / tot_classes <= 0.7499
				) {
					color = "rgb(255, 171, 16)";
				}

				if (course_type.includes("Lab")) {
					bunk_classes /= 2;
					bunk_classes = Math.floor(bunk_classes);
					if (bunk_classes == -1) {
						bunk_classes = 0;
					}
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: ${color};"><p style="margin: 0px;">+${bunk_classes}</p></td>`
					);
					row.innerHTML = new_Table_Content.join("");
				} else {
					if (bunk_classes == -1) {
						bunk_classes = 0;
					}
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: ${color};"><p style="margin: 0px;">+${bunk_classes}</p></td>`
					);
					row.innerHTML = new_Table_Content.join("");
				}
			}
		}
	});
};
