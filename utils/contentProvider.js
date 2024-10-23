const email_head = APP_URL + '/public/images/ehead.png';
const server_name = APP_NAME;
const email_footer = APP_URL + '/public/images/envelope.png';

function forgotPasswordMail(name, otp) {
    // let htmlContent = '<div style=" <b>' + name + '!</b><br><br>Your reset password OTP code is: ' + otp + '</div>' + server_name + ' Team</div></div><div style="max-width:600px;margin-bottom:10px"><img src="' + email_footer + '" alt="" style="max-width:100%" class="CToWUd a6T" tabindex="0"><div class="a6S" dir="ltr" style="opacity:.01;left:1032px;top:1949.25px"><div id=":27g" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" role="button" tabindex="0" data-tooltip-class="a1V"><div class="aSK J-J5-Ji aYr"></div></div></div></div></div></td></tr></tbody></table></div>';
    // return htmlContent;
    let reason = "This email is for forgot password purposes.";
    let textContent = `Hello ${name}!\n\nYour reset password OTP code is: ${otp}\n\n${reason}\n\nBest regards,\nServer Team`;
    
    return textContent;
}


async function contactUsMail(name, email, subject, message) {
    let htmlContent = '<div style="margin:0;padding:0;font-family:Lato,Tahoma,Verdana,Segoe,sans-serif;font-size:14px"><table cellspacing="0" cellpadding="0" width="100%" bgcolor="#EEEEEE" style="vertical-align:top;border-collapse:collapse"><tbody><tr style="vertical-align:top;border-collapse:collapse"><td align="center" valign="top" style="vertical-align:top;border-collapse:collapse"><div style="min-width:320px;max-width:600px;width:100%;margin:0 auto"><div style="padding:0"><a href="#"><img align="center" border="0" src="' + email_head + '" style="max-width:525px;width:87.5%;margin:10px auto 0" class="CToWUd"></a></div><div style="background:#fff;overflow:hidden;padding:0;max-width:525px;width:87.5%;text-align:left"><div style="padding:0 15px;margin-bottom:15px"><div style="font-size:18px;margin:0 0 5px;display:block;color:#000;text-decoration:none;text-align:center"><b>User Information</b><br><br>Name :<b>' + name + '</b><br>Email :<b>' + email + '</b><br>Subject :<b>' + subject + '</b><br>Message :<b>' + message + '</b></div></div><div style="color:#000;display:block;margin:10px 0;font-size:15px;text-align:center;text-decoration:none">' + server_name + ' Support Team</div></div><div style="max-width:600px;margin-bottom:10px"><img src="' + email_footer + '" alt="" style="max-width:100%" class="CToWUd a6T" tabindex="0"><div class="a6S" dir="ltr" style="opacity:.01;left:1032px;top:1949.25px"><div id=":27g" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" role="button" tabindex="0" data-tooltip-class="a1V"><div class="aSK J-J5-Ji aYr"></div></div></div></div></div></td></tr></tbody></table></div>';
    return htmlContent;
}
module.exports = { forgotPasswordMail, contactUsMail };