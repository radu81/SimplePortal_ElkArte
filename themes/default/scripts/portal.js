/**
 * @package SimplePortal
 *
 * @author SimplePortal Team
 * @copyright 2014 SimplePortal Team
 * @license BSD 3-clause
 *
 * @version 2.4
 */

/**
 * Used to collapse an individual block
 *
 * @param {string} id
 */
function sp_collapseBlock(id)
{
	$("#sp_block_" + id).slideToggle(300).promise().done(function() {
		var mode = false;

		if ($("#sp_block_" + id).is(":visible"))
			mode = true;

		// Save the choice, one way for guest, or theme options for members
		if (elk_member_id === 0)
			document.cookie = "sp_block_" + id + "=" + (mode ? 0 : 1);
		else
			elk_setThemeOption("sp_block_" + id, mode ? 0 : 1, null);

		// Swap the class to change the icon
		$("#sp_collapse_" + id).attr("class", mode ? "collapse" : "expand");
	});
}

/**
 * Used to collapse side (if enabled)
 *
 * @param {string} id
 */
function sp_collapseSide(id)
{
	var sp_sides = [];

	sp_sides[1] = "sp_left";
	sp_sides[4] = "sp_right";

	mode = document.getElementById(sp_sides[id]).style.display === "" ? 0 : 1;

	// Guests use a cookie, members a theme option to remember the choice
	if (elk_member_id === 0)
		document.cookie = sp_sides[id] + "=" + (mode ? 0 : 1);
	else
		elk_setThemeOption(sp_sides[id], mode ? 0 : 1, null);

	// Update the side expand/collapse image
	document.getElementById("sp_collapse_side" + id).className = (mode ? "dot collapse" : "dot expand");

	// Hide the side with a touch of animation
	$('#' + sp_sides[id]).toggle(400);
}

/**
 * Used to collapse the smiley box in the shoutbox
 *
 * @param {string} id
 * @param {boolean} has_image
 */
function sp_collapse_object(id, has_image)
{
	var mode = document.getElementById("sp_object_" + id).style.display === '' ? 0 : 1;

	$("#sp_object_" + id).toggle(300);

	if (typeof(has_image) === "undefined" || has_image === true)
		document.getElementById("sp_collapse_" + id).src = elk_images_url + (mode ? '/collapse.png' : '/expand.png');
}

function sp_image_resize()
{
	var possible_images = document.getElementsByTagName("img");

	for (var i = 0; i < possible_images.length; i++)
	{
		if (possible_images[i].className !== "bbc_img sp_article")
			continue;

		var temp_image = new Image();
		temp_image.src = possible_images[i].src;

		if (temp_image.width > 300)
		{
			possible_images[i].height = (300 * temp_image.height) / temp_image.width;
			possible_images[i].width = 300;
		}
		else
		{
			possible_images[i].width = temp_image.width;
			possible_images[i].height = temp_image.height;
		}
	}

	if (typeof (window_oldSPImageOnload) !== "undefined" && window_oldSPImageOnload)
	{
		window_oldSPImageOnload();
		window_oldSPImageOnload = null;
	}
}

/**
 * Send in a shout for display in a shoutbox
 *
 * @param {string} shoutbox_id
 * @param {string} sSessionVar
 * @param {string} sSessionId
 */
function sp_submit_shout(shoutbox_id, sSessionVar, sSessionId)
{
	if (window.XMLHttpRequest)
	{
		shoutbox_indicator(shoutbox_id, true);

		var shout_body = "";

		shout_body = escape(document.getElementById('new_shout_' + shoutbox_id).value.replace(/&#/g, "&#").php_to8bit()).replace(/\+/g, "%2B");

		sendXMLDocument(elk_prepareScriptUrl(sp_script_url) + 'action=shoutbox;xml', 'shoutbox_id=' + shoutbox_id + '&shout=' + shout_body + '&' + sSessionVar + '=' + sSessionId, onShoutReceived);

		document.getElementById('new_shout_' + shoutbox_id).value = '';

		return false;
	}
}

/**
 * Remove a previous entered shout
 *
 * @param {string} shoutbox_id
 * @param {string} shout_id
 * @param {string} sSessionVar
 * @param {string} sSessionId
 */
function sp_delete_shout(shoutbox_id, shout_id, sSessionVar, sSessionId)
{
	if (window.XMLHttpRequest)
	{
		shoutbox_indicator(shoutbox_id, true);

		sendXMLDocument(elk_prepareScriptUrl(sp_script_url) + 'action=shoutbox;xml', 'shoutbox_id=' + shoutbox_id + '&delete=' + shout_id + '&' + sSessionVar + '=' + sSessionId, onShoutReceived);

		return false;
	}
}

/**
 * Manually refresh the shoutbox ahead of the auto refresh action
 *
 * @param {string} shoutbox_id
 * @param {int} last_refresh
 */
function sp_refresh_shout(shoutbox_id, last_refresh)
{
	if (window.XMLHttpRequest)
	{
		shoutbox_indicator(shoutbox_id, true);

		getXMLDocument(elk_prepareScriptUrl(sp_script_url) + 'action=shoutbox;shoutbox_id=' + shoutbox_id + ';time=' + last_refresh + ';xml', onShoutReceived);

		return false;
	}
}

function onShoutReceived(XMLDoc)
{
	var shouts = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("shout");
	var shoutbox_id, updated, error, warning, reverse, shout, id, author, time, timeclean, delete_link, content, is_me, new_body = '';

	shoutbox_id = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("shoutbox")[0].childNodes[0].nodeValue;
	updated = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("updated")[0].childNodes[0].nodeValue;

	if (updated === "1")
	{
		error = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("error")[0].childNodes[0].nodeValue;
		warning = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("warning")[0].childNodes[0].nodeValue;
		reverse = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("reverse")[0].childNodes[0].nodeValue;

		if (warning !== "0")
			new_body += '<li class="shoutbox_warning smalltext">' + warning + '</li>';

		if (error !== "0")
			document.getElementById('shouts_' + shoutbox_id).innerHTML = new_body + '<li class="smalltext">' + error + '</li>';
		else
		{
			for (var i = 0; i < shouts.length; i++)
			{
				shout = XMLDoc.getElementsByTagName("elk")[0].getElementsByTagName("shout")[i];
				id = shout.getElementsByTagName("id")[0].childNodes[0].nodeValue;
				author = shout.getElementsByTagName("author")[0].childNodes[0].nodeValue;
				time = shout.getElementsByTagName("time")[0].childNodes[0].nodeValue;
				timeclean = shout.getElementsByTagName("timeclean")[0].childNodes[0].nodeValue;
				delete_link = shout.getElementsByTagName("delete")[0].childNodes[0].nodeValue;
				content = shout.getElementsByTagName("content")[0].childNodes[0].nodeValue;
				is_me = shout.getElementsByTagName("is_me")[0].childNodes[0].nodeValue;

				new_body += '<li>' + (is_me === "0" ? '<strong>' + author + ':</strong> ' : '') + content + '<br />' + (delete_link !== 0 ? ('<span class="shoutbox_delete">' + delete_link + '</span>') : '') + '<span class="smalltext shoutbox_time">' + time + '</span></li>';
			}

			document.getElementById('shouts_' + shoutbox_id).innerHTML = new_body;

			if (reverse !== "0")
				document.getElementById('shouts_' + shoutbox_id).scrollTop = document.getElementById('shouts_' + shoutbox_id).scrollHeight;
			else
				document.getElementById('shouts_' + shoutbox_id).scrollTop = 0;
		}
	}

	shoutbox_indicator(shoutbox_id, false);

	return false;
}

function shoutbox_indicator(shoutbox_id, turn_on)
{
	document.getElementById('shoutbox_load_' + shoutbox_id).style.display = turn_on ? '' : 'none';
}

function sp_catch_enter(key)
{
	var keycode;

	if (window.event)
		keycode = window.event.keyCode;
	else if (key)
		keycode = key.which;

	if (keycode === 13)
		return true;
}

function sp_show_ignored_shout(shout_id)
{
	document.getElementById('ignored_shout_' + shout_id).style.display = '';
	document.getElementById('ignored_shout_link_' + shout_id).style.display = 'none';
}

function sp_show_history_ignored_shout(shout_id)
{
	document.getElementById('history_ignored_shout_' + shout_id).style.display = '';
	document.getElementById('history_ignored_shout_link_' + shout_id).style.display = 'none';
}

function elk_prepareScriptUrl(sUrl)
{
	return sUrl.indexOf('?') === -1 ? sUrl + '?' : sUrl + (sUrl.charAt(sUrl.length - 1) === '?' || sUrl.charAt(sUrl.length - 1) === '&' || sUrl.charAt(sUrl.length - 1) === ';' ? '' : ';');
}

function sp_showMoreSmileys(postbox, sTitleText, sPickText, sCloseText, elk_theme_url, elk_smileys_url)
{
	if (this.oSmileyPopupWindow !== undefined && 'closed' in this.oSmileyPopupWindow && !this.oSmileyPopupWindow.closed)
	{
		this.oSmileyPopupWindow.focus();
		return;
	}

	if (sp_smileyRowsContent === undefined)
	{
		var sp_smileyRowsContent = '';
		for (i = 0; i < sp_smileys.length; i++)
		{
			sp_smileys[i][2] = sp_smileys[i][2].replace(/"/g, '&quot;');
			sp_smileys[i][0] = sp_smileys[i][0].replace(/"/g, '&quot;');
			sp_smileyRowsContent += '<a href="javascript:void(0);" onclick="window.opener.replaceText(\' ' + sp_smileys[i][0].php_addslashes() + '\', window.opener.document.getElementById(\'new_shout_' + postbox + '\')); window.focus(); return false;"><img src="' + elk_smileys_url + '/' + sp_smileys[i][1] + '" id="sml_' + sp_smileys[i][1] + '" alt="' + sp_smileys[i][2] + '" title="' + sp_smileys[i][2] + '" style="padding: 4px;" border="0" /></a> ';
		}
	}

	this.oSmileyPopupWindow = window.open('', 'add_smileys', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,width=480,height=220,resizable=yes');

	this.oSmileyPopupWindow.document.open('text/html', 'replace');
	this.oSmileyPopupWindow.document.write(sp_moreSmileysTemplate.easyReplace({
		smileyRows: sp_smileyRowsContent
	}));

	this.oSmileyPopupWindow.document.close();
}

/**
 * When using html or php, disable the editor so it does not "fight" with what
 * the user wants to enter.
 */
function sp_update_editor(select)
{
	var new_state = document.getElementById(select).value,
		instance = $("textarea").sceditor("instance");

	// Going back to BBC
	if (new_state === "bbc" && instance === undefined)
	{
		// Start the editor again
		elk_editor();
	}
	else if (new_state !== "bbc" && instance !== undefined)
	{
		// Update the the original text area with current editor contents and stop the editor
		if (new_state === 'html')
			instance.updateOriginal();
		instance.destroy();
	}
}

/**
 * Used by the theme selection block to swap the preview image
 * @param {type} obj
 */
function sp_theme_select(obj)
{
	var id = obj.options[obj.selectedIndex].value;
	document.getElementById("sp_ts_thumb").src = sp_ts_thumbs[id];
}

/**
 * Used to swap the day on the calendar to update the days events
 * @param {type} id
 */
function sp_collapseCalendar(id)
{
	new_day = "sp_calendar_" + id;

	if (new_day === current_day)
		return false;

	document.getElementById(current_day).style.display = "none";
	document.getElementById(new_day).style.display = "";
	current_day = new_day;
}

/**
 * Admin Blocks area, used to expand the areas under advanced
 * @param {type} id
 */
function sp_collapseObject(id)
{
	mode = document.getElementById("sp_object_" + id).style.display;
	mode = (mode === "" | mode === "block") ? false : true;

	// Make it close smoothly
	$("#sp_object_" + id).slideToggle(300);

	document.getElementById("sp_collapse_" + id).src = elk_images_url + (!mode ? "/selected_open.png" : "/selected.png");
}

/**
 * Surrounds the selected text with text1 and text2.
 *  - If no text is selected, simply appends text1/text2 to the end
 *
 * @param {string} text1
 * @param {string} text2
 * @param {object} oTextHandle
 */
function sp_surroundText(text1, text2, oTextHandle)
{
	// Can a text range be created, start off with Internet explorer < 9.
	if ('caretPos' in oTextHandle && 'createTextRange' in oTextHandle)
	{
		var caretPos = oTextHandle.caretPos,
			temp_length = caretPos.text.length;

		caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) === ' ' ? text1 + caretPos.text + text2 + ' ' : text1 + caretPos.text + text2;

		if (temp_length === 0)
		{
			caretPos.moveStart('character', -text2.length);
			caretPos.moveEnd('character', -text2.length);
			caretPos.select();
		}
		else
			oTextHandle.focus(caretPos);
	}
	// Compliant text range wrap.
	else if ('selectionStart' in oTextHandle)
	{
		var begin = oTextHandle.value.substr(0, oTextHandle.selectionStart),
			selection = oTextHandle.value.substr(oTextHandle.selectionStart, oTextHandle.selectionEnd - oTextHandle.selectionStart),
			end = oTextHandle.value.substr(oTextHandle.selectionEnd),
			newCursorPos = oTextHandle.selectionStart,
			scrollPos = oTextHandle.scrollTop;

		oTextHandle.value = begin + text1 + selection + text2 + end;

		if (oTextHandle.setSelectionRange)
		{
			if (selection.length === 0)
				oTextHandle.setSelectionRange(newCursorPos + text1.length, newCursorPos + text1.length);
			else
				oTextHandle.setSelectionRange(newCursorPos, newCursorPos + text1.length + selection.length + text2.length);

			oTextHandle.focus();
		}

		oTextHandle.scrollTop = scrollPos;
	}
	// Just put them on the end, then.
	else
	{
		oTextHandle.value += text1 + text2;
		oTextHandle.focus(oTextHandle.value.length - 1);
	}
}