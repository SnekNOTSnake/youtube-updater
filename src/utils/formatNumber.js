const formatNumber = (val) => {
	return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

module.exports = formatNumber;
