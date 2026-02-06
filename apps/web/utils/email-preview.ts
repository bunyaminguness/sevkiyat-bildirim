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
    const isDraft = !form.reportNo;
    const reportNoDisplay = form.reportNo || "TASLAK";
    const reportTypeText = form.type === "Missing" ? "Eksik Ürün" : "Hasarlı Ürün";

    const tplPart = form.tplNo ? ` | TPL ${form.tplNo}` : " | [TPL No Eksik]";
    const storePart = form.storeCode ? ` | Mağaza ${form.storeCode}` : " | [Mağaza Kodu Eksik]";

    const subject = `${reportNoDisplay} | ${reportTypeText}${tplPart}${storePart}`;

    // 2. Determine Recipient
    const recipient = form.recipientEmail || "[Alıcı Seçilmedi]";

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
    body += `Rapor No: ${reportNoDisplay}\n`;
    body += `Mağaza: ${form.storeCode || "[MAĞAZA KODU EKSİK]"}\n`;
    body += `TPL No: ${form.tplNo || "[TPL NO EKSİK]"}\n`;

    if (form.waybillNo) {
        body += `İrsaliye No: ${form.waybillNo}\n`;
    }

    // Format date DD.MM.YYYY
    let formattedDate = "[TARİH EKSİK]";
    if (form.shipmentDate) {
        try {
            const dateObj = new Date(form.shipmentDate);
            if (!isNaN(dateObj.getTime())) {
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                formattedDate = `${day}.${month}.${year}`;
            }
        } catch (e) {
            // fallback handled by initial value
        }
    }
    body += `Sevkiyat Tarihi: ${formattedDate}\n\n`;

    // Products
    body += `${typeWordTitle} Ürünler:\n`;

    if (!form.items || form.items.length === 0) {
        body += "- (Ürün girilmedi)\n";
    } else {
        const validItems = form.items.filter(i => i.productNo || i.productName);
        if (validItems.length === 0) {
            body += "- (Yeni ürün bekleniyor...)\n";
        } else {
            validItems.forEach(item => {
                const pNo = item.productNo || "[Ür.No Eksik]";
                const pName = item.productName || "[Ür.Adı Eksik]";
                const qty = item.qty || 0;

                let line = `- ${pNo} - ${pName} (Miktar: ${qty}`;

                if (form.type === "Damaged" && item.damageType) {
                    line += `, Hasar: ${item.damageType}`;
                }
                line += ")";
                body += line + "\n";
            });
        }
    }

    return {
        subject,
        body,
        recipient
    };
}
