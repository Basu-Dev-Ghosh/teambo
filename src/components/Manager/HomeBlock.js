import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState } from "react";
import { onValue, set, ref, update } from 'firebase/database'
import {
  Col,
  Container,
  Row,
} from "react-bootstrap";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import NewTask from "./NewTask";
import { db, auth } from '../../firebase-config';
import { onAuthStateChanged } from 'firebase/auth'
import NavBar from "../Navs/NavBar";
import { useNavigate } from "react-router";
import Loader from "../Loader/Loader";
import TaskHistory from "./TaskHistory";



export default function HomeBlock(props) {
  const fromTeammate = useRef({});
  const toTeammate = useRef({});
  const navigate = useNavigate();
  const [selected, setSelected] = useState(
    JSON.parse(localStorage.getItem("teammateSelected")) === undefined ? 0 : JSON.parse(localStorage.getItem("teammateSelected"))
  );

  const [manager, setManager] = useState({});
  const [managerId, setManagerId] = useState({});
  const [once, setOnce] = useState(true);
  const [loading, setLoading] = useState(true);
  const [teammateList, setTeammateList] = useState([]);
  const [taskSelected, setTaskSelected] = useState();
  const [teammateSelected, setTeammateSelected] = useState();
  const [modalShow, setModalShow] = useState(false);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (once) {
        setLoading(true)
        onValue(ref(db, `manager/${user.uid}`), (snapshot) => {
          if (snapshot.exists()) {
            let data = snapshot.val()
            setManager(data)
            setManagerId(user.uid)
            setTeammateList(data.teammates)
          } else {
            console.log('No data available')
          }
          setLoading(false)
        })
        setOnce(false)
      }
    } else {
      window.location.href = '/'
    }
  })
  const diff_hours = (dt2, dt1) => {
    var diff = (new Date("" + dt2).getTime() - new Date("" + dt1).getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(diff);
  }
  const handleDeleteTask = (teammate, id, index) => {
    let list1 = teammate.tasks.slice(0, index);
    let list2 = teammate.tasks.slice(index + 1);
    let list = list1.concat(list2)
    set(ref(db, `/manager/${managerId}/teammates/${id}/data/tasks`), list)
      .catch((err) => {
        console.log(err);
      });
  }

  function dragStart(e, index, list, id) {
    fromTeammate.current.id = id;
    fromTeammate.current.tasks = list;
    fromTeammate.current.taskIndex = index;
  }

  function dragEnter(e, index, list, id) {
    toTeammate.current.id = id;
    toTeammate.current.tasks = list;
    toTeammate.current.taskIndex = index;
  }

  function drop(e, index, list, id) {
    if (fromTeammate.current.id === toTeammate.current.id && fromTeammate.current.taskIndex === toTeammate.current.taskIndex) {
      return;
    }
    var today = new Date()
    if (fromTeammate.current.id === toTeammate.current.id) {
      let copyList = [...fromTeammate.current.tasks];
      const dragItemContent = copyList[fromTeammate.current.taskIndex];
      copyList.splice(fromTeammate.current.taskIndex, 1);
      copyList.splice(toTeammate.current.taskIndex, 0, dragItemContent);
      fromTeammate.current.taskIndex = null;
      toTeammate.current.taskIndex = null;
      let now = 0
      if (manager.teammates[fromTeammate.current.id].data.tasks[index].updates[manager.teammates[fromTeammate.current.id].data.tasks[index].updates.length - 1].status === "On Going")
        now = diff_hours(today, manager.teammates[fromTeammate.current.id].data.tasks[index].updates[manager.teammates[fromTeammate.current.id].data.tasks[index].updates.length - 1].startTimeStamp)
      let manHour1 = manager.teammates[fromTeammate.current.id].data.manHours + now
      update(ref(db, `/manager/${managerId}/teammates/${id}/data/`), { manHours: manHour1 }).then(() => {
        update(ref(db, `/manager/${managerId}/clients/${manager.teammates[fromTeammate.current.id].data.tasks[index].clientIndex}`), { manHours: props?.manager?.clients[manager.teammates[fromTeammate.current.id].data.tasks[index].clientIndex].manHours + now })
      })
      update(ref(db, `/manager/${managerId}/teammates/${fromTeammate.current.id}/data/`), {
        tasks: copyList,
      })
    }
    else {
      let copyList = [...fromTeammate.current.tasks];
      const dragItemContent = copyList[fromTeammate.current.taskIndex];
      const newTask = {
        client: dragItemContent?.client,
        task: dragItemContent?.task,
        manHours: 0,
        clientIndex: dragItemContent?.clientIndex,
        updates: dragItemContent?.updates.concat({
          description: ['This task was switched to you.'],
          startTimeStamp: "null",
          assignedStartDate: dragItemContent?.updates[dragItemContent?.updates?.length - 1].assignedStartDate,
          assignedStartTime: dragItemContent?.updates[dragItemContent?.updates?.length - 1].assignedStartTime,
          corrections: dragItemContent?.updates?.length || 0,
          deadlineDate: '--',
          deadlineTime: '--',
          status: 'Assigned',
        },),
      }
      newTask.updates[newTask.updates.length - 2].status = "Done"
      newTask.updates[newTask.updates.length - 2].endDate =
        String(today.getDate()).padStart(2, '0') +
        '/' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '/' +
        today.getFullYear()
      newTask.updates[newTask.updates.length - 2].endTime =
        today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()
      newTask.updates[newTask.updates.length - 2].startTimeStamp = null
      let now = 0
      if (manager.teammates[fromTeammate.current.id].data.tasks[index].updates[manager.teammates[fromTeammate.current.id].data.tasks[index].updates.length - 1].status === "On Going")
        now = diff_hours(today, manager.teammates[fromTeammate.current.id].data.tasks[index].updates[manager.teammates[fromTeammate.current.id].data.tasks[index].updates.length - 1].startTimeStamp)
      let manHour1 = manager.teammates[fromTeammate.current.id].data.manHours + now
      let toLiveTask = manager.teammates[toTeammate.current.id].data.liveTasks + 1
      let toTotalNumberOfTasks = manager.teammates[toTeammate.current.id].data.totalNumberOfTasks + 1
      let fromLiveTask = manager.teammates[fromTeammate.current.id].data.liveTasks - 1
      update(ref(db, `/manager/${managerId}/teammates/${id}/data/`), { manHours: manHour1 }).then(() => {
        update(ref(db, `/manager/${managerId}/clients/${manager.teammates[fromTeammate.current.id].data.tasks[index].clientIndex}`), { manHours: manager.clients[manager.teammates[fromTeammate.current.id].data.tasks[index].clientIndex].manHours + now })
      })
      if (toLiveTask >= 0 && toLiveTask >= 0) {
        update(ref(db, `/manager/${managerId}/teammates/${fromTeammate.current.id}/data`), { liveTasks: fromLiveTask })
        update(ref(db, `/manager/${managerId}/teammates/${toTeammate.current.id}/data`), { liveTasks: toLiveTask, totalNumberOfTasks: toTotalNumberOfTasks })
      }
      if (toTeammate.current.tasks) {
        set(ref(db, `manager/${managerId}/teammates/${toTeammate.current.id}/data/tasks/${toTeammate.current.tasks.length || 0}`), newTask,)
        handleDeleteTask(fromTeammate.current, fromTeammate.current.id, fromTeammate.current.taskIndex)
      }
      else {
        set(ref(db, `manager/${managerId}/teammates/${toTeammate.current.id}/data/tasks/0`), newTask,)
        handleDeleteTask(fromTeammate.current, fromTeammate.current.id, fromTeammate.current.taskIndex)
      }
    }
  }

  return (
    <div style={{ backgroundColor: '#FFF' }}>
      <NavBar
        user="MANAGER"
        user2="MANAGER"
        name={manager.name}
        role={manager.designation}
      />
      {
        loading ? <Loader /> : <div id="main">
          <Container>
            <Row className="curve-box-homelist">
              <Col style={{ marginTop: "1em" }}>
                {!selected ? (
                  <Row>
                    <Col
                      sm={6}
                      md={6}
                      style={{ marginTop: "1em" }}>
                      <h3 className="blue">Teammate Tasks</h3>
                    </Col>
                    <Col
                      sm={6}
                      md={6}
                      style={{ marginTop: "1em" }}
                      className="text-end">
                      <div>
                        <FontAwesomeIcon
                          onClick={() => {
                            navigate('/manager/home/list')
                          }}
                          icon="fa-solid fa-list"
                          style={{ paddingRight: "1em", fontSize: "20px" }}
                        />

                        <FontAwesomeIcon
                          icon="fa-solid fa-grip "
                          color="#5f8fee"
                          style={{ paddingRight: "1em", fontSize: "20px" }}
                        />
                        <NewTask
                          name={"No Teammate"}
                          description={"Selected"}
                        />
                      </div>
                    </Col>
                  </Row>
                ) : (
                    teammateList
                      .filter((info) => info.teammateId === selected)
                      .map((info) => {
                        return selected ? (
                          <Row>
                            <Col
                              sm={6}
                              md={6}
                              style={{ marginTop: "1em" }}>
                              <h3 className="blue">Teammate Tasks</h3>
                            </Col>
                            <Col
                              sm={6}
                              md={6}
                              style={{ marginTop: "1em" }}
                              className="text-end">
                              <div>
                                <FontAwesomeIcon
                                  className="pointer"
                                  onClick={() => {
                                    navigate('/manager/home/list');
                                  }}
                                  icon="fa-solid fa-list"
                                  style={{ marginRight: "1em", fontSize: "20px" }}
                                />

                                <FontAwesomeIcon
                                  className="pointer"
                                  icon="fa-solid fa-grip "
                                  color="#5f8fee"
                                  style={{ marginRight: "1em", fontSize: "20px" }}
                                />
                                <NewTask
                                  name={info.data.name}
                                  designation={info.data.designation}
                                  teammate={info.data}
                                  teammateIndex={info.teammateIndex}
                                  tasks={info.data.tasks}
                                  manager={manager}
                                  managerId={managerId}
                                />
                              </div>
                            </Col>
                          </Row>
                        ) : (
                          <></>
                        );
                      })
                )}
              </Col>
              <Container className="overflow-set-auto table-height2">
                <ResponsiveMasonry
                  columnsCountBreakPoints={{ 300: 1, 600: 2, 750: 3, 900: 4 }}>
                  <Masonry>
                    {!teammateList ? (
                      <Row
                        colSpan={7}
                        align="center">
                        No teammate right now
                      </Row>
                    ) : (
                        teammateList.map((info) => {
                          return (
                            <div
                              key={info.teammate}
                              onClick={() => {
                                localStorage.setItem(
                                  "teammateSelected",
                                  JSON.stringify(info.teammateId)
                                );
                                setSelected(info.teammateId);
                                setTeammateSelected(info.teammateIndex);
                              }}>
                              <div className="cards">
                                <div className="heading bg-blue p-3 rounded-3">
                                  <h5>{info.data.name}</h5>
                                  <span>{info.data.designation}</span>
                                </div>
                                {(info.data.liveTasks === 0) ? (
                                  <div className="card-tasks">
                                    <Row
                                      colSpan={7}
                                      align="center"

                                      onDragEnter={(e) => {
                                        dragEnter(e, 0, info?.data?.tasks, info?.teammateIndex)
                                      }}
                                      onDragEnd={(e) => {
                                        drop(e, 0, info?.data?.tasks, info?.teammateIndex)
                                      }}
                                    >
                                      No tasks assigned
                                    </Row>
                                  </div>
                                ) : (
                                    info?.data?.tasks?.map((info1, index) => {
                                      return (
                                        <div
                                          style={(info1.updates[
                                            info1.updates.length - 1
                                        ].status === "Completed" && { display: "none" }) || (info1.updates[
                                          info1.updates.length - 1
                                            ].status === "Archived" && { display: "none" }) || { padding: "1.6em" }}
                                        key={index}
                                        onClick={() => {
                                          setModalShow(true);
                                          setTaskSelected(index);
                                        }}
                                        className="card-tasks">
                                        <Row draggable
                                          onDragStart={(e) => {
                                            dragStart(e, index, info?.data?.tasks, info?.teammateIndex)
                                          }}
                                          onDragEnter={(e) => {
                                            dragEnter(e, index, info?.data?.tasks, info?.teammateIndex)
                                          }}
                                          onDragEnd={(e) => {
                                            drop(e, index, info?.data?.tasks, info?.teammateIndex)
                                          }}
                                        >
                                          <Col sm="8">
                                            <span>{info1.client}</span>
                                            <br />
                                            <span>{info1.task}</span>
                                          </Col>
                                          <Col sm="4">
                                            {info1.updates.sort((a, b) =>
                                              a.corrections > b.corrections
                                                ? 1
                                                : -1,
                                            )
                                              .filter(
                                                (info2, index1) => index1 === 0,
                                              )
                                              .map((info2) => {
                                                return (
                                                    <span
                                                      style={
                                                        (info1.updates[
                                                          info1.updates.length - 1
                                                        ].status === "Done" && {
                                                          fontFamily: "rockwen",
                                                          color: "#000000",
                                                          fontWeight: "bold",
                                                      }) ||
                                                      (info1.updates[
                                                        info1.updates.length - 1
                                                      ].status === "Archived" && {
                                                        fontFamily: "rockwen",
                                                        color: "#000000",
                                                        fontWeight: "bold",
                                                      }) ||
                                                      (info1.updates[
                                                        info1.updates.length - 1
                                                      ].status === "Completed" && {
                                                        fontFamily: "rockwen",
                                                        color: "#000000",
                                                        fontWeight: "bold",
                                                      }) ||
                                                      (info1.updates[
                                                        info1.updates.length - 1
                                                        ].status === "On Going" && {
                                                          fontFamily: "rockwen",
                                                          color: "#24A43A",
                                                          fontWeight: "bold",
                                                        }) ||
                                                        (info1.updates[
                                                          info1.updates.length - 1
                                                        ].status === "Paused" && {
                                                          fontFamily: "rockwen",
                                                          color: "#2972B2",
                                                          fontWeight: "bold",
                                                        }) ||
                                                        (info1.updates[
                                                          info1.updates.length - 1
                                                        ].status === "Assigned" && {
                                                          fontFamily: "rockwen",
                                                          color: "#D1AE00",
                                                          fontWeight: "bold",
                                                      })
                                                      }
                                                      className="text-end task-status">
                                                      {
                                                        info1.updates[
                                                          info1.updates.length - 1
                                                        ].status
                                                      }
                                                  </span>
                                                )
                                              })}
                                          </Col>
                                        </Row>
                                        <hr className="divider" style={{ marginBottom: "-22px" }} />
                                          </div>

                                    );
                                  })
                                )}

                              </div>

                            </div>
                          );
                        })
                    )}
                  </Masonry>
                </ResponsiveMasonry>
              </Container>
            </Row>
          </Container>
          {
            teammateList[teammateSelected]?.data?.tasks !== undefined && taskSelected !== null && teammateSelected !== null ? (
              <TaskHistory
                show={modalShow}
                id={teammateList[teammateSelected]?.teammateId}
                onHide={() => { setModalShow(false); setTaskSelected(null); }}
                indexselected={taskSelected}
                teamtasks={teammateList[teammateSelected]?.data?.tasks}
                name={teammateList[teammateSelected]?.data?.name}
                managerid={props?.managerId}
                teammateindex={teammateSelected}
                designation={teammateList[teammateSelected]?.data?.designation}
              />
            ) : (
              <></>
            )}
        </div>
      }

    </div>
  );
}
