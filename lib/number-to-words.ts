/**
 * Converts a number to Indian currency words
 */
export function numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/;

    const getWords = (n: number) => {
        if (n === 0) return '';
        if (n < 20) return a[n];
        const tens = Math.floor(n / 10);
        const units = n % 10;
        return b[tens] + (units > 0 ? ' ' + a[units] : '');
    };

    if (num === 0) return 'Zero Only';
    
    let str = '';
    const n = ('000000000' + Math.floor(num)).slice(-9).match(regex);
    if (!n) return '';

    str += Number(n[1]) !== 0 ? getWords(Number(n[1])) + 'Crore ' : '';
    str += Number(n[2]) !== 0 ? getWords(Number(n[2])) + 'Lakh ' : '';
    str += Number(n[3]) !== 0 ? getWords(Number(n[3])) + 'Thousand ' : '';
    str += Number(n[4]) !== 0 ? getWords(Number(n[4])) + 'Hundred ' : '';
    str += Number(n[5]) !== 0 ? (str !== '' ? 'and ' : '') + getWords(Number(n[5])) : '';

    return str.trim() + ' Only';
}
