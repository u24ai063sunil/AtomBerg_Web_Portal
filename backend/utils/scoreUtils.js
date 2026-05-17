function computeScore(uomType, targetNumeric, targetDate, actualNumeric, completionDate) {
    switch (uomType) {
        case 'MIN':
            // Higher is better
            return Math.min((actualNumeric / targetNumeric) * 100, 150);
        case 'MAX':
            // Lower is better
            return actualNumeric === 0 ? 0 : Math.min((targetNumeric / actualNumeric) * 100, 150);
        case 'TIMELINE':
            if (!targetDate || !completionDate) return 0;
            const diffTime = new Date(targetDate) - new Date(completionDate);
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysDifference >= 0) {
                return 100 + Math.min(daysDifference, 50); // early bonus
            } else {
                return Math.max(0, 100 + daysDifference); // penalize late
            }
        case 'ZERO':
            return actualNumeric === 0 ? 100 : 0;
        default:
            return 0;
    }
}

module.exports = { computeScore };
