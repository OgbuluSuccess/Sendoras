const { Resend } = require('resend');
const resend = new Resend('re_YEzizncQ_3SNEGAAtYsp6vaVzsMUgGdUE');

async function check() {
  try {
    const list = await resend.domains.list();
    console.log(JSON.stringify(list, null, 2));
    
    // verify the sendoras.online domain
    const domains = list.data ? list.data.data : [];
    const target = domains.find(d => d.name === 'sendoras.online');
    if (target) {
        console.log("Verifying...", target.id);
        const res = await resend.domains.verify(target.id);
        console.log(JSON.stringify(res, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}
check();
