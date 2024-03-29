import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { ref, set } from 'firebase/database'
import React, { useState } from 'react'
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap'
import { auth, db } from '../../firebase-config'
import moment from 'moment'

export default function TaskHistory(props) {
  const [showDoubt, setShowDoubt] = useState(false)
  const [assignedDate, setAssignedDate] = useState();
  const handleClose = () => setShowDoubt(false);
  const handleShow = () => setShowDoubt(true);
  const [updateTaskForm, setUpdateTaskForm] = useState(false)
  const [updateAdditionalTaskForm, setUpdateAdditionalTaskForm] = useState(false)
  const [taskUpdate, setTaskUpdate] = useState({
    corrections: '',
    status: 'Assigned',
    assignedStartDate: '--',
    assignedStartTime: '--',
    deadlineDate: '--',
    description: '',
    deadlineTime: '--',
  })
  const dateFormatChange = (date) => {
    if (date === '--' || !date) {
      return '--'
    }
    let givenDate = date.split('/')
    let months = [
      '-',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    let dateMonth = months[parseInt(givenDate[1])]
    return dateMonth + ',' + givenDate[0] + ' ' + givenDate[2]
  }

  const timeFormatChange = (time) => {
    if (time === '--' || !time) {
      return '--'
    }
    let givenTime = time.split(':')
    if (parseInt(givenTime[0]) === 0 || parseInt(givenTime[0]) === 24) {
      let minute =
        parseInt(givenTime[1]) > 9
          ? parseInt(givenTime[1])
          : '0' + parseInt(givenTime[1])
      return '12:' + minute + ' am'
    } else if (parseInt(givenTime[0]) === 12) {
      let minute =
        parseInt(givenTime[1]) > 9
          ? parseInt(givenTime[1])
          : '0' + parseInt(givenTime[1])

      return "12:" + minute + ' pm'
    } else if (parseInt(givenTime[0]) > 12) {
      let hour =
        parseInt(givenTime[0]) % 12 > 9
          ? parseInt(givenTime[0]) % 12
          : '0' + parseInt(givenTime[0] % 12)
      let minute =
        parseInt(givenTime[1]) > 9
          ? parseInt(givenTime[1])
          : '0' + parseInt(givenTime[1])

      return hour + ':' + minute + ' pm'
    } else if (parseInt(givenTime[0]) < 12) {
      let hour =
        parseInt(givenTime[0]) > 9
          ? parseInt(givenTime[0])
          : '0' + parseInt(givenTime[0])
      let minute =
        parseInt(givenTime[1]) > 9
          ? parseInt(givenTime[1])
          : '0' + parseInt(givenTime[1])

      return hour + ':' + minute + ' am'
    }
  }

  const handleTaskCorrection = (id, index, correction) => {
    set(ref(db, `/manager/${auth.currentUser.uid}/teammates/${props?.teammateindex}/data/tasks/${index}/updates/${correction}`), {
      assignedStartDate: taskUpdate.assignedStartDate,
      assignedStartTime: taskUpdate.assignedStartTime,
      corrections: props?.teamtasks[props?.indexselected]?.updates?.length,
      status: 'Assigned',
      deadlineDate: taskUpdate.deadlineDate,
      description: { 0: taskUpdate.description },
      deadlineTime: taskUpdate.deadlineTime,
    })
      .then(() => {
        handleTaskCorrectionClear();
      })
      .catch((err) => {
        console.log(err)
      })
  }
  const handleTaskCorrection1 = (id, index, correction) => {
    let deadLineDate = taskUpdate.deadlineDate !== "--" ? taskUpdate.deadlineDate : props?.teamtasks[props?.indexselected]?.updates[0].deadlineDate
    let deadlineTime = taskUpdate.deadlineTime !== "--" ? taskUpdate.deadlineTime : props?.teamtasks[props?.indexselected]?.updates[0].deadlineTime
    let assignedStartTime = taskUpdate.assignedStartTime !== "--" ? taskUpdate.assignedStartTime : props?.teamtasks[props?.indexselected]?.updates[0].assignedStartTime
    let assignedStartDate = taskUpdate.assignedStartDate !== "--" ? taskUpdate.assignedStartDate : props?.teamtasks[props?.indexselected]?.updates[0].assignedStartDate
    let description = taskUpdate.description !== "" ? [taskUpdate.description].concat(props?.teamtasks[props?.indexselected]?.updates[0].description) : props?.teamtasks[props?.indexselected]?.updates[0].description
    set(ref(db, `/manager/${auth.currentUser.uid}/teammates/${props?.teammateindex}/data/tasks/${index}/updates/${correction - 1}/`), {
      assignedStartDate: assignedStartDate,
      assignedStartTime: assignedStartTime,
      corrections: correction - 1,
      status: props?.teamtasks[props?.indexselected]?.updates[0].status,
      deadlineDate: deadLineDate,
      description: description,
      deadlineTime: deadlineTime,
    })
      .then(() => {
        handleTaskCorrectionClear();
      })
      .catch((err) => {
        console.log(err)
      })
  }
  const handleTaskCorrectionClear = () => {
    setTaskUpdate({
      corrections: '',
      deadlineDate: '--',
      deadlineTime: '--',
      assignedStartDate: '--',
      assignedStartTime: '--',
      description: '',
    })
    setUpdateTaskForm(false)
    setUpdateAdditionalTaskForm(false)
  }
  const handleAdditionalTaskCorrection1 = (id, index, correction) => {
    if (taskUpdate.description !== "")
      set(ref(db, `/manager/${auth.currentUser.uid}/teammates/${props?.teammateindex}/data/tasks/${index}/updates/${correction - 1}/description/`),
        [taskUpdate.description].concat(props?.teamtasks[props?.indexselected]?.updates[0].description))
        .then(() => {
          set(ref(db, `/manager/${auth.currentUser.uid}/teammates/${props?.teammateindex}/data/tasks/${index}/query/`), null).then(() => { handleTaskCorrectionClear(); })
        })
        .catch((err) => {
          console.log(err)
        })
  }
  const handleDateChange = (event) => {
    let date = event.target.value.split('-')
    taskUpdate.deadlineDate = date[2] + '/' + date[1] + '/' + date[0]
  }
  const handleStartDateChange = (event) => {
    setAssignedDate(event.target.value)
    let date = event.target.value.split('-')
    taskUpdate.assignedStartDate = date[2] + '/' + date[1] + '/' + date[0]
  }
  const handleChange = (event) => {
    let newInput = { [event.target.name]: event.target.value }
    setTaskUpdate({ ...taskUpdate, ...newInput })
  }
  const descriptionList = (array) => {
    return <p>{array}<br /></p>
  }
  return (
    <div>
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title>
            <Button variant="light" onClick={props?.onHide}>
              <FontAwesomeIcon icon="fa-solid fa-chevron-left" />{" "}
              Close
            </Button>
            <Button variant="light" onClick={() => { handleShow() }}
              style={
                props?.teamtasks[props?.indexselected]?.query
                  ? {
                    border: '1px solid #9b9b9b',
                    color: 'black',
                    fontFamily: 'rockwen',
                    fontWeight: 'bold',
                    padding: '.5em',
                    paddingLeft: '1.5em',
                    borderRadius: '15px',
                    position: "absolute",
                    right: "1em"
                  }
                  : {
                    border: '1px solid #9b9b9b',
                    color: 'black',
                    fontFamily: 'rockwen',
                    fontWeight: 'bold',
                    padding: '.5em',
                    borderRadius: '15px',
                    position: "absolute",
                    right: "1em"
                  }
              }>
              <FontAwesomeIcon
                className="pointer"
                icon="fa-regular fa-envelope"
                size="xl" />
              {props?.teamtasks[props?.indexselected]?.query ?
                (
                  <div style={{ marginBottom: "5px", marginLeft: "5px" }} class="notification-dot"></div>
                ) :
                (
                  <></>
                )
              }
            </Button>
            <Modal show={showDoubt}
              backdrop="static" onHide={() => { handleClose() }}>
              <Modal.Header closeButton></Modal.Header>
              <Modal.Body>
                {props?.teamtasks[props?.indexselected]?.query ?
                  <Form>
                    <Form.Group
                      className="mb-3"
                      controlId="exampleForm.ControlTextarea1"
                    >
                      <Form.Label>Teammate has a query:<br />"{props?.teamtasks[props?.indexselected]?.query}"</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="description"
                        onChange={handleChange}
                        rows={3} />
                    </Form.Group>
                    <Button variant="primary" onClick={() => {
                      handleAdditionalTaskCorrection1(
                        props?.id,
                        props?.indexselected,
                        props?.teamtasks[props?.indexselected]?.updates?.length,
                      )
                    }}>
                      Send
                    </Button>
                  </Form>
                  : <>No Queries From The Teammate</>}
              </Modal.Body>
            </Modal>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "1.5em", marginLeft: "1.5em", marginRight: "1.5em" }}>
          <Row style={{ padding: "auto", margin: "auto" }}>
            <Col sm={6} md={6} style={{ marginTop: '1em' }}>
              <h5>{props?.name}</h5>
              <h6>{props?.designation}</h6>
            </Col>
          </Row>
          <Row style={{ paddingLeft: ".5em", alignItems: "bottom" }}>
            <Col sm={1} md={1} style={{ marginTop: '1em' }}>
              <h6>Client</h6>
            </Col>
            <Col sm={3} md={3} style={{ marginTop: '.75em' }} title={props?.teamtasks[props?.indexselected]?.client}>
              <h5>{props?.teamtasks[props?.indexselected]?.client.length > 15 ? props?.teamtasks[props?.indexselected]?.client.slice(0, 12) + "..." : props?.teamtasks[props?.indexselected]?.client}
              </h5>
            </Col>
            <Col sm={1} md={1} style={{ marginTop: '1em' }}>
              <h6>Task</h6>
            </Col>
            <Col sm={3} md={3} style={{ marginTop: '.75em' }}>
              {props?.teamtasks[props?.indexselected]?.task.length > 20 ? props?.teamtasks[props?.indexselected]?.task.slice(0, 17) + "..." : props?.teamtasks[props?.indexselected]?.task}
            </Col>
            <Col sm={1} md={1} style={{ marginTop: '1em' }}>
              <h6>Status</h6>
            </Col>
            <Col sm={3} md={3} style={{ marginTop: '.75em' }}>
              {props?.teamtasks[props?.indexselected]?.updates
                .sort((a, b) => (a.corrections > b.corrections ? -1 : 1))
                .filter((info, index) => { return (index === 0) })
                .map((info) => {
                  return (<>
                    <h5
                      style={
                        (info.status === 'Done' && {
                          fontFamily: 'rockwen',
                          color: '#000000',
                        }) ||
                        (info.status === 'On Going' && {
                          fontFamily: 'rockwen',
                          color: '#24A43A',
                        }) ||
                        (info.status === 'Paused' && {
                          fontFamily: 'rockwen',
                          color: '#2972B2',
                        }) ||
                        (info.status === 'Assigned' && {
                          fontFamily: 'rockwen',
                          color: '#D1AE00',
                        })
                      }
                    >
                      {
                        info.status
                      }
                    </h5></>)
                })}

            </Col>
          </Row>
          <Table
            style={{
              borderCollapse: 'separate',
              borderSpacing: '0 10px',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  style={{
                    width: '100px',
                    fontFamily: 'rockwen',
                  }}
                >
                  Corrections
                </TableCell>
                <TableCell
                  style={{
                    width: '200px',
                    fontFamily: 'rockwen',
                  }}
                  align="center"
                >
                  Description
                </TableCell>
                <TableCell
                  style={{
                    fontFamily: 'rockwen',
                  }}
                  align="center"
                >
                  Start Time
                </TableCell>
                <TableCell
                  style={{
                    fontFamily: 'rockwen',
                  }}
                  align="center"
                >
                  Deadline
                </TableCell>
                <TableCell
                  style={{
                    fontFamily: 'rockwen',
                  }}
                  align="center"
                >
                  Completed
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7}>
                  <Row className="d-grid gap-2">
                    {props?.teamtasks[props?.indexselected]?.updates
                      .sort((a, b) => (a.corrections > b.corrections ? -1 : 1))
                      .filter((info, index) => { return (index === 0) })
                      .map((info, index) => {
                        return (<>
                          {info.status === 'Done' ? <Button
                            disabled={
                              info.status !== 'Done' || updateTaskForm
                            }
                            onClick={() => { setUpdateTaskForm(true); setUpdateAdditionalTaskForm(false); }}
                            variant="outline-primary"
                            block
                          >
                            + Add Correction
                          </Button> : <></>
                          }
                          {info.status !== 'Done' ? <Button
                            disabled={updateAdditionalTaskForm}
                            onClick={() => { setUpdateAdditionalTaskForm(true); }}
                            variant="outline-primary"
                            block
                          >
                            + Add Additional Correction
                          </Button> : <></>
                          }</>)
                      })}
                  </Row>
                </TableCell>
              </TableRow>
              {updateTaskForm ? (
                <TableRow>
                  <TableCell
                    style={{
                      width: '100px',
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    +{props?.teamtasks[props?.indexselected]?.updates?.length}
                  </TableCell>
                  <TableCell
                    style={{
                      width: '200px',
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <Form.Control
                      as="textarea"
                      name="description"
                      onChange={handleChange}
                    />
                  </TableCell>
                  <TableCell
                    style={{
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="date"
                          min={moment().format('YYYY-MM-DD')}
                          name="assignedStartDate"
                          style={{ fontSize: '12px' }}
                          onChange={handleStartDateChange}
                        />
                      </Col>
                    </Row>
                    <br />
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="time"
                          name="assignedStartTime"
                          style={{ fontSize: '12px' }}
                          onChange={handleChange}
                        />
                      </Col>
                    </Row>
                  </TableCell>
                  <TableCell
                    style={{
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="date"
                          min={assignedDate || moment().format('YYYY-MM-DD')}
                          name="deadlineDate"
                          style={{ fontSize: '12px' }}
                          onChange={handleDateChange}
                        />
                      </Col>
                    </Row>
                    <br />
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="time"
                          name="deadlineTime"
                          style={{ fontSize: '12px' }}
                          onChange={handleChange}
                        />
                      </Col>
                    </Row>
                  </TableCell>
                  <TableCell
                    style={{
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <FontAwesomeIcon
                      className="pointer"
                      onClick={() =>
                        handleTaskCorrection(
                          props?.id,
                          props?.indexselected,
                          props?.teamtasks[props?.indexselected]?.updates?.length,
                        )
                      }
                      size="2xl"
                      style={{
                        color: 'blue',
                        paddingRight: '.25em',
                      }}
                      icon="fa-solid fa-square-check"
                    />
                    <FontAwesomeIcon
                      className="pointer"
                      onClick={handleTaskCorrectionClear}
                      icon="fa-solid fa-square-xmark"
                      size="2xl"
                      style={{
                        color: 'red',
                        paddingRight: '.25em',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <></>
              )}
              {updateAdditionalTaskForm ? (
                <TableRow>
                  <TableCell
                    style={{
                      width: '100px',
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                  </TableCell>
                  <TableCell
                    style={{
                      width: '200px',
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <Form.Control
                      as="textarea"
                      name="description"
                      onChange={handleChange}
                    />
                  </TableCell>
                  <TableCell
                    style={{
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="date"
                          min={moment().format('YYYY-MM-DD')}
                          name="assignedStartDate"
                          style={{ fontSize: '12px' }}
                          onChange={handleStartDateChange}
                        />
                      </Col>
                    </Row>
                    <br />
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="time"
                          name="assignedStartTime"
                          style={{ fontSize: '12px' }}
                          onChange={handleChange}
                        />
                      </Col>
                    </Row>
                  </TableCell>
                  <TableCell
                    style={{
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="date"
                          min={assignedDate || moment().format('YYYY-MM-DD')}
                          name="deadlineDate"
                          style={{ fontSize: '12px' }}
                          onChange={handleDateChange}
                        />
                      </Col>
                    </Row>
                    <br />
                    <Row className="justify-content-md-center">
                      <Col sm={10}>
                        <Form.Control
                          type="time"
                          name="deadlineTime"
                          style={{ fontSize: '12px' }}
                          onChange={handleChange}
                        />
                      </Col>
                    </Row>
                  </TableCell>
                  <TableCell
                    style={{
                      fontFamily: 'rockwen',
                    }}
                    align="center"
                  >
                    <FontAwesomeIcon
                      className="pointer"
                      onClick={() =>
                        handleTaskCorrection1(
                          props?.id,
                          props?.indexselected,
                          props?.teamtasks[props?.indexselected]?.updates?.length,
                        )
                      }
                      size="2xl"
                      style={{
                        color: 'blue',
                        paddingRight: '.25em',
                      }}
                      icon="fa-solid fa-square-check"
                    />
                    <FontAwesomeIcon
                      className="pointer"
                      onClick={() => handleTaskCorrectionClear()}
                      icon="fa-solid fa-square-xmark"
                      size="2xl"
                      style={{
                        color: 'red',
                        paddingRight: '.25em',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <></>
              )}

              {props?.teamtasks[props?.indexselected]?.updates
                .sort((a, b) => (a.corrections > b.corrections ? -1 : 1))
                .map((info, index) => {
                  return (
                    <TableRow style={index !== 0 ? { opacity: '50%' } : {}}>
                      <TableCell
                        style={{
                          width: '100px',
                          fontFamily: 'rockwen',
                        }}
                        align="center"
                      >
                        {info.corrections === '0'
                          ? '0'
                          : '+' + info.corrections}
                      </TableCell>
                      <TableCell
                        style={{
                          width: '200px',
                          fontFamily: 'rockwen',
                        }}
                        align="center"
                      >{info.description.map(descriptionList)}
                      </TableCell>
                      <TableCell
                        style={{
                          fontFamily: 'rockwen',
                        }}
                        align="center"
                      >
                        {dateFormatChange(info.assignedStartDate)}
                        <br />
                        {timeFormatChange(info.assignedStartTime)}
                      </TableCell>
                      <TableCell
                        style={{
                          fontFamily: 'rockwen',
                        }}
                        align="center"
                      >
                        {dateFormatChange(info.deadlineDate)}
                        <br />
                        {timeFormatChange(info.deadlineTime)}
                      </TableCell>
                      <TableCell
                        style={{
                          fontFamily: 'rockwen',
                        }}
                        align="center"
                      >
                        {info.status === 'Done' ? (
                          dateFormatChange(info.endDate)
                        ) : (
                          <br />
                        )}
                        <br />
                        {info.status === 'Done' ? (
                          timeFormatChange(info.endTime)
                        ) : (
                          <br />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </Modal.Body>
      </Modal>
    </div>
  )
}
