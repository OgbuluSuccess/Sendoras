const { Resend } = require("resend");
const resend = new Resend("re_YEzizncQ_3SNEGAAtYsp6vaVzsMUgGdUE");

async function check() {
  try {
    const list = await resend.domains.list();
    const domains = list.data ? list.data.data : [];
    const target = domains.find((d) => d.name === "sendhiiv.com");
    if (target) {
      console.log(JSON.stringify(target, null, 2));
    } else {
      console.log("Not found");
    }
  } catch (err) {
    console.error(err);
  }
}
check();
