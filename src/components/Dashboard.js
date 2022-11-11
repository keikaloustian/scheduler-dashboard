import React, { Component } from "react";
import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";
import axios from "axios";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState((previousState) =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  selectPanel(id) {
    this.setState((prev) => ({
      focused: prev.focused ? null : id,
    }));
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused,
    });

    if (this.state.loading) {
      return <Loading />;
    }

    const panelsArray = (
      this.state.focused
        ? data.filter((panel) => this.state.focused === panel.id)
        : data
    ).map((datum) => {
      return (
        <Panel
          key={datum.id}
          label={datum.label}
          value={datum.getValue(this.state)}
          onSelect={(event) => this.selectPanel(datum.id)}
        />
      );
    });

    return <main className={dashboardClasses}>{panelsArray}</main>;
  }
}

export default Dashboard;
