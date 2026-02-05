export interface ReportItem {
    productNo: string;
    productName: string;
    qty: number;
    damageType?: string;
}

export interface ReportForm {
    reportNo?: string; // Optional, defaults to TASLAK
    storeCode: string;
    type: string;
    tplNo: string;
    waybillNo?: string;
    shipmentDate: string;
    notes?: string;
    items: ReportItem[];
    recipientEmail?: string;
}

export interface EmailPreviewResult {
    subject: string;
    body: string;
    recipient: string;
}

export function buildEmailPreview(form: ReportForm): EmailPreviewResult {
    // 1. Determine Subject
    const reportNo = form.reportNo || "TASLAK";
    const reportTypeText = form.type === "Missing" ? "Eksik Ürün" : "Hasarlı Ürün";

    // Format: {RaporNo or TASLAK} | {BildirimTipi} | TPL {TplNo} | Mağaza {MagazaKodu}
    const tplPart = form.tplNo ? ` | TPL ${form.tplNo}` : "";
    const storePart = form.storeCode ? ` | Mağaza ${form.storeCode}` : "";

    const subject = `${reportNo} | ${reportTypeText}${tplPart}${storePart}`;

    // 2. Determine Recipient
    const recipient = form.recipientEmail || "[Alıcı seçilmedi]";

    // 3. Build Body
    const typeWord = form.type === "Missing" ? "eksik" : "hasarlı";
    const typeWordTitle = form.type === "Missing" ? "Eksik" : "Hasarlı";

    let body = "Sayın Yetkili,\n\n";
    body += `Aşağıda bilgileri yer alan sevkiyat kapsamında, mağazamıza teslim edilmesi gereken bazı ürünlerin ${typeWord} olarak ulaştığı tespit edilmiştir.\n\n`;
    body += "İlgili sevkiyata ait detaylar sistem kayıtlarımızda ve ekte sunulan görsellerde açıkça yer almaktadır.\n\n";
    body += `${typeWordTitle} teslimatın incelenerek gerekli aksiyonların alınmasını, tarafımıza geri dönüş sağlanmasını rica ederiz.\n\n`;
    body += "Bilgilerinize sunar, iyi çalışmalar dileriz.\n\n";
    body += "Saygılarımızla.\n\n";
    body += "--------------------------------------------------\n";
    body += "BİLDİRİM DETAYLARI\n";
    body += "--------------------------------------------------\n";
    body += `Rapor No: ${reportNo}\n`;
    body += `Mağaza: ${form.storeCode || "[MAĞAZA KODU EKSİK]"}\n`;
    body += `TPL No: ${form.tplNo || "[TPL NO EKSİK]"}\n`;

    if (form.waybillNo) {
        body += `İrsaliye No: ${form.waybillNo}\n`;
    }

    // Format date DD.MM.YYYY
    let formattedDate = form.shipmentDate;
    try {
        if (form.shipmentDate) {
            const dateObj = new Date(form.shipmentDate);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedDate = `${day}.${month}.${year}`;
        }
    } catch (e) {
        // keep original if parse fails
    }
    body += `Sevkiyat Tarihi: ${formattedDate}\n\n`;

    // Products
    body += `${typeWordTitle} Ürünler:\n`;

    if (!form.items || form.items.length === 0) {
        body += "- (Ürün girilmedi)\n";
    } else {
        form.items.forEach(item => {
            const pNo = item.productNo || "[Ürün No]";
            const pName = item.productName || "[Ürün Adı]";
            const qty = item.qty || 0;

            let line = `- ${pNo} - ${pName} (Miktar: ${qty}`;

            if (form.type === "Damaged" && item.damageType) {
                line += `, Hasar: ${item.damageType}`;
            }
            line += ")";
            body += line + "\n";
        });
    }

    return {
        subject,
        body,
        recipient
    };
}
