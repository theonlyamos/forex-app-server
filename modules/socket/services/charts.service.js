class ChartsService {
  static all() {
    return this.charts;
  }

  static create(event_id, charts = []) {
    return (this.charts[event_id] = [...(this.charts[event_id] || []), ...charts]);
  }

  static get(event_id) {
    return this.charts[event_id];
  }

  static add(event_id, chart = {}) {
    !this.charts[event_id] && (this.charts[event_id] = []);
    this.charts[event_id].push(chart);
    return (this.charts[event_id] = this.charts[event_id]);
  }
}

ChartsService.charts = {};

module.exports = ChartsService;
