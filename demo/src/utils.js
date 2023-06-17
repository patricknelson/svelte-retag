/**
 * Quick hack to show amount of time since initial page load in MS (rounded to 2 decimals).
 *
 * @returns number
 */
export function getTimePassed() {
	const duration = (new Date()).getTime() - window.performance.timeOrigin;
	return duration.toFixed(2);
}
