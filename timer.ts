export class TimeHandler {
	
	private time = 1;

	constructor(private minTime: number = 1, private maxTime: number = 32, private multiplicated: number = 2) {
		this.time = this.minTime;
	}

	handler(condition: boolean) {

		// Если условие истинно, то увеличиваем время ожидания
		if (condition) {
	
			// Если время ожидания меньше чем maxTime, то умножаем его на множитель
			this.time = this.time < this.maxTime ? this.time*this.multiplicated : this.time;

		}
		// Иначе, возвратить минимальное время
		else {

			this.time = this.minTime;
			return this.minTime;

		}

	}

}