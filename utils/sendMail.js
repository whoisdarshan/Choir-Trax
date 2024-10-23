// const nodemailer = require('nodemailer');
// const { MailtrapTransport } = require("mailtrap");
// const TOKEN = "8ffd2fed6b0c9906a6bbadfd181838b3";

// const transport = nodemailer.createTransport(
//     MailtrapTransport({
//         token: TOKEN
//         // testInboxId: 3016408,
//     })
// )
// // const sender = {
// //     address: "mailtrap@example.com",
// //     name: "Mailtrap Test",
// // };
// // const recipients = [
// //     "darshansavaliya2005@gmail.com",
// // ];

// const sendMail=function(to,subject,body){
//     let message={
//         from:"<admin@gmail.com>",
//         to:to,
//         subject:subject,
//         text:body
//     }
//     transport.sendMail(message,function(err,info){
//         if(err){
//             console.log(err)
//         }else{
//             console.log(info)
//         }
//     })
// }



const { MailtrapClient } = require('mailtrap');

// Define the Mailtrap API token
// const TOKEN = "8ffd2fed6b0c9906a6bbadfd181838b3";
const TOKEN = "d27267faeefdc793e7e5ff7b695305da";

// Initialize the Mailtrap client
const client = new MailtrapClient({ token: TOKEN });

// Define the sendMail function
const sendMail = async function(to, subject, body) {
    try {
        // Create the message data
        let message = {
            from: { email: 'hello@demomailtrap.com'}, // Sender info
            to: [{ email: to }], // Recipient info
            subject: subject, // Email subject
            text: body, // Plain text body
        };

        // Send email using Mailtrap API
        const response = await client.send(message);
        
        console.log('Email sent successfully:', response);
    } catch (err) {
        console.error('Error sending email:', err);
    }
};

module.exports = sendMail;