export class TimeHandler {
	
	time = 1;
	minTime;
	maxTime;
	multiplicated;

	constructor(minTime = 1, maxTime = 32, multiplicated = 2) {
		this.minTime = minTime;
		this.maxTime = maxTime;
		this.multiplicated = multiplicated;

		this.time = this.minTime;
	}

	handler(condition) {

		// Если условие истинно, то увеличиваем время ожидания
		if (condition) {
	
			// Если время ожидания меньше чем maxTime, то умножаем его на множитель
			this.time = this.time < this.maxTime ? this.time*this.multiplicated : this.time;

		}
		// Иначе, вовратить минимальное время
		else {

			this.time = this.minTime;
			return this.minTime;

		}

	}

}