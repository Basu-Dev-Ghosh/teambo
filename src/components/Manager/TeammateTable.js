import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { ref, set, update } from 'firebase/database'
import React, { useRef, useState } from 'react'
import {
    Button,
    Col,
    OverlayTrigger,
    Popover,
    Row,
} from "react-bootstrap";
import TaskHistory from './TaskHistory'
import SwitchTask from './SwitchTask';
import { auth, db } from '../../firebase-config';
import axios from 'axios';
import { clientTaskComplete, clientTaskDelete } from './ClientTaskCount';
import { notifyCompleteTask, notifyDeleteTask } from './NotificationFunctions';

export default function TeammateTable(props) {
    const selected = props?.teammateselected
    const filter = props?.filterTeammate;
    const [show, setShow] = useState(false);
    const [taskSelected, setTaskSelected] = useState();
    const [modalShow, setModalShow] = useState(false);
    const [switchTask, setSwitchTask] = useState()
    const [prevTeammateId, setPrevTeammateId] = useState("");
    const [prevTeammateIndex, setPrevTeammateIndex] = useState("");
    const [prevTaskIndex, setPrevTaskIndex] = useState()
    const dragItem = useRef();
    const dragOverItem = useRef();


    const diff_hours = (dt2, dt1) => {
        var diff = (new Date("" + dt2).getTime() - new Date("" + dt1).getTime()) / 1000;
        diff /= (60 * 60);
        return Math.abs(diff);
    }

    const handleDeleteTask = async (teammate, id, index, clientIndex) => {
        var today = new Date()
        let now = 0
        if (teammate.tasks[index].updates[teammate.tasks[index].updates.length - 1].status === "On Going")
            now = diff_hours(today, teammate.tasks[index].updates[teammate.tasks[index].updates.length - 1].startTimeStamp)
        let manHour = teammate.tasks[index].manHours + now
        let manHour1 = teammate.manHours + now
        const newLiveTaskCount = teammate.liveTasks - 1
        notifyDeleteTask(teammate.notifications, props?.managerId, id, props?.manager?.clients[clientIndex].name)
        clientTaskDelete(props?.managerId, clientIndex, props?.manager?.clients[clientIndex].taskCount, props?.manager?.clients[teammate.tasks[index].clientIndex].manHours + now)
        update(ref(db, `/manager/${auth.currentUser.uid}/teammates/${id}/data/`), { liveTasks: newLiveTaskCount })
        update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data/tasks/${index}/updates/${teammate.tasks[index].updates.length - 1}`), {
            status: "Archived",
            endDate:
                String(today.getDate()).padStart(2, '0') +
                '/' +
                String(today.getMonth() + 1).padStart(2, '0') +
                '/' +
                today.getFullYear(),
            endTime:
                today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds(),
        }).then(() => {
            update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data/tasks/${index}/`), { manHours: manHour }).then(() => {
                update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data/`), { manHours: manHour1 })
            })
        })
            .catch((err) => {
                console.log(err);
            });
        const subject = `
                    <h4> Your Task ${teammate.tasks[index].task} has been Removed By manager ${props?.manager.name}</h4>
                    <br />
                    <p>Thank you</p>
                `
        const heading = "Task Removed";
        const text = `Your Task ${teammate.tasks[index].task} has been Removed By manger ${props?.manager.name}`
        try {
            const res = await axios.post("https://us-central1-teambo-c231b.cloudfunctions.net/taskCompleted", {
                heading, fromEmail: props?.manager.email, toEmail: teammate.email, subject: subject, name: teammate.name, text: text, whatsAppNo: teammate?.whatsAppNo
            });
            if (res.status === 200) {
                const newLiveTaskCount = props?.manager.teammates[id].data.liveTasks - 1
                if (teammate.tasks[index].updates[teammate.tasks[index].updates.length - 1].status !== 'Completed')
                    update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data`), { liveTasks: newLiveTaskCount })
                if (teammate.tasks.length === 1 && teammate.tasks[index].updates[teammate.tasks[index].updates.length - 1].status !== 'Completed')
                    update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data`), { liveTasks: newLiveTaskCount })
            }
            else {
                alert("Something went wrong");
            }
        } catch (err) {
            alert("error")
            console.log(err)
        }
    }

    const handleDeleteSwitchTask = async (teammate, id, index) => {
        let list1 = teammate.tasks.slice(0, index);
        let list2 = teammate.tasks.slice(index + 1);
        let list = list1.concat(list2)
        var today = new Date()
        let now = 0
        const newLiveTaskCount = teammate.liveTasks - 1
        if (teammate.tasks[index].updates[teammate.tasks[index].updates.length - 1].status === "On Going")
            now = diff_hours(today, teammate.tasks[index].updates[teammate.tasks[index].updates.length - 1].startTimeStamp)
        let manHour1 = teammate.manHours + now
        update(ref(db, `/manager/${auth.currentUser.uid}/teammates/${id}/data/`), { manHours: manHour1, liveTasks: newLiveTaskCount }).then(() => {
            update(ref(db, `/manager/${auth.currentUser.uid}/clients/${teammate.tasks[index].clientIndex}`), { manHours: props?.manager?.clients[teammate.tasks[index].clientIndex].manHours + now })
        })
        set(ref(db, `/manager/${auth.currentUser.uid}/teammates/${id}/data/tasks`), list)
            .catch((err) => {
                console.log(err);
            });
        const subject = `
                    <h4> Your Task ${teammate.tasks[index].task} has been Switched to another teammate By manager ${props?.manager.name}</h4>
                    <br />
                    <p>Thank you</p>
                `
        const heading = "Task Switched";
        const text = `Your Task ${teammate.tasks[index].task} has been Removed By manger ${props?.manager.name}`
        try {
            const res = await axios.post("https://us-central1-teambo-c231b.cloudfunctions.net/taskCompleted", {
                heading, fromEmail: props?.manager.email, toEmail: teammate.email, subject: subject, name: teammate.name, text: text, whatsAppNo: teammate?.whatsAppNo
            });
            if (res.status === 200) {
            }
            else {
                alert("Something went wrong");
            }
        } catch (err) {
            alert("error")
            console.log(err)
        }
    }

    const handleCompleteTask = async (teammate, id, index, latest) => {
        notifyCompleteTask(teammate.notifications, props?.managerId, id, teammate.tasks[index].client)
        const subject = `
    <h4> Your Task ${teammate.tasks[index].task} has been Approved By manger ${props?.manager.name}</h4>
    <br />
    <p>Thank you</p>
   `
        const heading = "Task Approved"
        const text = `Your Task ${teammate.tasks[index].task} has been Approved By manger ${props?.manager.name}`
        try {
            const res = await axios.post("https://us-central1-teambo-c231b.cloudfunctions.net/taskCompleted", {
                heading, fromEmail: props?.manager.email, toEmail: teammate.email, subject: subject, name: teammate.name, text: text, whatsAppNo: teammate?.whatsAppNo
            });
            if (res.status === 200) {
                const newLiveTaskCount = props?.manager.teammates[id].data.liveTasks - 1
                clientTaskComplete(props?.managerId, teammate.tasks[index].clientIndex, props?.manager?.clients[teammate.tasks[index].clientIndex].taskCount)
        update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data/tasks/${index}/updates/${latest}`), { status: "Completed" })
                update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data`), { liveTasks: newLiveTaskCount })
            }
            else {
                alert("Something went wrong");
            }
        } catch (err) {
            alert("error")
            console.log(err)
        }
    }

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
    const dragStart = (e, index) => {
        dragItem.current = index;

    }
    const dragEnter = (e, index) => {
        dragOverItem.current = index;
    }

    const drop = (e, list, id) => {
        let copyList = [...list];
        const dragItemContent = copyList[dragItem.current];
        copyList.splice(dragItem.current, 1);
        copyList.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        update(ref(db, `/manager/${props?.managerId}/teammates/${id}/data/`), {
            tasks: copyList,
        })
    }



    return (<>
        <div className="overflow-set-auto table-height1">
            <Row className="table-height1">
                <Col>
                    <Table
                        stickyHeader
                        style={{
                            borderCollapse: 'separate',
                            borderSpacing: '0 10px',
                            paddingLeft: "10px",
                        }}>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "180px"
                                    }}
                                    align="center"
                                >
                                    Client
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "150px"
                                    }}
                                    align="center"
                                >
                                    Task
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "130px"
                                    }}
                                    align="center"
                                >
                                    Start Time
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "130px"
                                    }}
                                    align="center"
                                >
                                    Deadline
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "100px"
                                    }}
                                    align="center"
                                >
                                    Completed
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "100px"
                                    }}
                                    align="center"
                                >
                                    Corrections
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "120px"
                                    }}
                                    align="center"
                                >
                                    Status
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontFamily: 'rockwen',
                                        width: "60px"
                                    }}
                                    align="center"></TableCell>
                            </TableRow>
                        </TableHead>
            <TableBody className="curve-box-homelist" >
                {props?.team
                    .filter((info) => info.teammateId === selected)
                    .map((info) => {
                        return (
                            <>
                                {(info.data.liveTasks === 0) ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" > No tasks assigned</TableCell>
                                    </TableRow>
                                ) : (
                                        info?.data?.tasks?.filter((info1) => {
                                        return filter !== "All" ?
                                            info1.updates[
                                                info1.updates.length - 1
                                            ].status === filter
                                            : info1.updates[
                                                info1.updates.length - 1
                                                ].status !== filter
                                            // && info1.updates[
                                            //     info1.updates.length - 1
                                            // ].status !== "Completed" && info1.updates[
                                            //     info1.updates.length - 1
                                            // ].status !== "Archived"
                                    }).map((info1, index) => {
                                        return (
                                            <TableRow
                                                key={index}
                                                style={
                                                    info1.updates[
                                                        info1.updates.length - 1
                                                    ].status === 'Archived' && {
                                                        display: 'none',
                                                    } || info1.updates[
                                                        info1.updates.length - 1
                                                    ].status === 'Completed' && {
                                                        display: 'none',
                                                    } || {
                                                        backgroundColor:
                                                            info1.updates[
                                                                info1.updates.length - 1
                                                            ].status !== 'Done'
                                                                ? '#fff'
                                                                : '#f1f4fb',
                                                        borderRadius: "15px",
                                                        marginLeft: "5px",
                                                        marginRight: "5px",
                                                        boxShadow: "0px 1px 18px #0000001A",
                                                    }}
                                                draggable
                                                onDragStart={(e) => {
                                                    dragStart(e, index)
                                                }}
                                                onDragEnter={(e) => {
                                                    dragEnter(e, index)
                                                }}
                                                onDragEnd={(e) => {
                                                    drop(e, info?.data?.tasks, info?.teammateIndex)
                                                }}

                                            >
                                                <TableCell
                                                    onClick={() => {
                                                        setModalShow(true);
                                                        setTaskSelected(index);
                                                    }}
                                                    style={{
                                                        fontFamily: 'rockwen',

                                                    }}
                                                    align="center"
                                                    title={info1.client}
                                                >
                                                    {info1.client.length > 15 ? info1.client.slice(0, 12) + "..." : info1.client}
                                                </TableCell>
                                                <TableCell
                                                    onClick={() => {
                                                        setModalShow(true);
                                                        setTaskSelected(index);
                                                    }}
                                                    style={{
                                                        fontFamily: 'rockwen'
                                                    }}
                                                    align="center"
                                                    title={info1.task}
                                                >{info1?.task?.length < 14 ? info1.task : info1?.task?.slice(0, 11) + "..."}
                                                    {info1.query ?
                                                        (
                                                            <div style={{ marginLeft: ".8em" }} class="notification-dot"></div>
                                                        ) :
                                                        (
                                                            <></>
                                                        )
                                                    }
                                                </TableCell>
                                                {info1.updates
                                                    .sort((a, b) =>
                                                        a.corrections > b.corrections
                                                            ? 1
                                                            : -1,
                                                    )
                                                    .filter(
                                                        (info2, index1) => index1 === 0,
                                                    )
                                                    .map((info2) => {
                                                        return (
                                                            <>
                                                                <TableCell
                                                                    onClick={() => {
                                                                        setModalShow(true);
                                                                        setTaskSelected(index);
                                                                    }}
                                                                    style={{
                                                                        fontFamily: 'rockwen',
                                                                        width: "120px"
                                                                    }}
                                                                    align="center"

                                                                >
                                                                    {dateFormatChange(
                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].assignedStartDate,
                                                                    )}
                                                                    <br />
                                                                    {timeFormatChange(
                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].assignedStartTime,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell
                                                                    onClick={() => {
                                                                        setModalShow(true);
                                                                        setTaskSelected(index);
                                                                    }}
                                                                    style={{
                                                                        fontFamily: 'rockwen',
                                                                        width: "120px"
                                                                    }}
                                                                    align="center"

                                                                >
                                                                    {dateFormatChange(
                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].deadlineDate,
                                                                    )}
                                                                    <br />
                                                                    {timeFormatChange(
                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].deadlineTime,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell
                                                                    onClick={() => {
                                                                        setModalShow(true);
                                                                        setTaskSelected(index);
                                                                    }}
                                                                    style={{
                                                                        fontFamily: 'rockwen',
                                                                    }}
                                                                    align="center"

                                                                >
                                                                    {info1.updates[
                                                                        info1.updates.length - 1
                                                                    ].status === 'Done' || info1.updates[
                                                                        info1.updates.length - 1
                                                                        ].status === 'Archived' || info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status === 'Completed'  
                                                                        ? dateFormatChange(
                                                                            info1.updates[
                                                                                info1.updates
                                                                                    .length - 1
                                                                            ].endDate,
                                                                        )
                                                                        : '--'}
                                                                    <br />
                                                                    {info1.updates[
                                                                        info1.updates.length - 1
                                                                    ].status === 'Done' || info1.updates[
                                                                        info1.updates.length - 1
                                                                        ].status === 'Archived' || info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status === 'Completed'  
                                                                        ? timeFormatChange(
                                                                            info1.updates[
                                                                                info1.updates
                                                                                    .length - 1
                                                                            ].endTime,
                                                                        )
                                                                        : '--'}
                                                                </TableCell>
                                                                <TableCell
                                                                    onClick={() => {
                                                                        setModalShow(true);
                                                                        setTaskSelected(index);
                                                                    }}
                                                                    style={{
                                                                        fontFamily: 'rockwen',
                                                                    }}
                                                                    align="center"

                                                                >
                                                                    {info1.updates[
                                                                        info1.updates.length - 1
                                                                    ].corrections === '0'
                                                                        ? info1.updates[
                                                                            info1.updates.length -
                                                                            1
                                                                        ].corrections
                                                                        : '+' +
                                                                        info1.updates[
                                                                            info1.updates.length -
                                                                            1
                                                                        ].corrections}

                                                                </TableCell>
                                                                <TableCell
                                                                    onClick={() => {
                                                                        setModalShow(true);
                                                                        setTaskSelected(index);
                                                                    }}
                                                                    align="center"

                                                                    style={
                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status === 'Done' ? {
                                                                            fontFamily: 'rockwen',
                                                                            color: '#000000',
                                                                            fontWeight: 'bold',
                                                                        } :
                                                                            info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status ===
                                                                                'Archived' ? {
                                                                            fontFamily: 'rockwen',
                                                                            color: '#24A43A',
                                                                            fontWeight: 'bold',
                                                                            width: '105px'
                                                                            } :
                                                                                info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status ===
                                                                                    'On Going' ? {
                                                                            fontFamily: 'rockwen',
                                                                            color: '#24A43A',
                                                                            fontWeight: 'bold',
                                                                            width: '105px'
                                                                                } :
                                                                                    info1.updates[
                                                                            info1.updates.length - 1
                                                                                    ].status === 'Paused' ? {
                                                                            fontFamily: 'rockwen',
                                                                            color: '#2972B2',
                                                                            fontWeight: 'bold',
                                                                                    } :
                                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status ===
                                                                                            'Assigned' ? {
                                                                            fontFamily: 'rockwen',
                                                                            color: '#D1AE00',
                                                                            fontWeight: 'bold',
                                                                                        } : {}
                                                                    }
                                                                >
                                                                    {info1.updates[
                                                                        info1.updates.length - 1
                                                                    ].status === 'Done' ? (
                                                                            <FontAwesomeIcon
                                                                            size="xl"
                                                                            icon="fa-solid fa-circle-check"
                                                                        />
                                                                    ) : (
                                                                        info1.updates[
                                                                            info1.updates.length - 1
                                                                        ].status
                                                                    )}
                                                                </TableCell>
                                                            </>
                                                        )
                                                    })}
                                                <TableCell
                                                    align="center"
                                                    className="text-end"
                                                >
                                                    {filter === "All" ? <OverlayTrigger
                                                        trigger="click"
                                                        key="bottom"
                                                        placement="auto"
                                                        rootClose
                                                        overlay={show ?
                                                            <Popover
                                                                id={`popover-positioned-bottom`}
                                                            >
                                                                <Popover.Body>
                                                                    <Row
                                                                        className="d-grid gap-2"
                                                                        style={{
                                                                            marginBottom: '.5em',
                                                                        }}
                                                                    >
                                                                        <Button
                                                                            disabled={info1.updates[
                                                                                info1.updates.length - 1
                                                                            ].status !== 'Done' ? true : false}
                                                                            onClick={() => {
                                                                                handleCompleteTask(
                                                                                    info.data,
                                                                                    info.teammateIndex,
                                                                                    index,
                                                                                    info1.updates.length - 1
                                                                                );
                                                                                setShow(false);
                                                                            }}
                                                                            variant="light"
                                                                            style={{
                                                                                textAlign: 'left',
                                                                            }}
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon="fa-solid fa-circle-check"
                                                                                style={{
                                                                                    paddingRight:
                                                                                        ".5em",
                                                                                    color: "blue",
                                                                                }}
                                                                            />
                                                                            Mark Completed
                                                                        </Button>
                                                                    </Row>
                                                                    <Row
                                                                        className="d-grid gap-2"
                                                                        style={{
                                                                            marginBottom: '.5em',
                                                                        }}
                                                                    >  <Button
                                                                        variant="light"
                                                                        style={{
                                                                            textAlign: 'left',
                                                                        }}
                                                                        onClick={(e) => {
                                                                            setPrevTeammateId(info.teammateId);
                                                                            setPrevTeammateIndex(info.teammateIndex);
                                                                            setPrevTaskIndex(index);
                                                                            setSwitchTask(info1);
                                                                            setShow(false);

                                                                        }}
                                                                    >
                                                                            <FontAwesomeIcon
                                                                                icon="fa-solid fa-shuffle"
                                                                                style={{
                                                                                    paddingRight:
                                                                                        '.5em',
                                                                                    color: "blue",
                                                                                }}
                                                                            />
                                                                            Switch Task To..
                                                                        </Button>
                                                                    </Row>
                                                                    <Row
                                                                        className="d-grid gap-2"
                                                                        style={{
                                                                            marginBottom: '.5em',
                                                                        }}
                                                                    >
                                                                        <Button
                                                                            onClick={() => {
                                                                                handleDeleteTask(
                                                                                    info.data,
                                                                                    info.teammateIndex,
                                                                                    index,
                                                                                    info1.clientIndex
                                                                                );
                                                                                setShow(false);
                                                                            }}
                                                                            variant="light"
                                                                            style={{
                                                                                textAlign: 'left',
                                                                            }}
                                                                            block
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon="fa-solid fa-trash"
                                                                                style={{
                                                                                    paddingRight:
                                                                                        '.5em',
                                                                                    color: "blue",
                                                                                }}
                                                                            />
                                                                            Delete Task
                                                                        </Button>
                                                                    </Row>
                                                                </Popover.Body>
                                                            </Popover> : <></>
                                                        }
                                                    >
                                                        <FontAwesomeIcon
                                                            className="pointer"
                                                            size='xl'
                                                            color='#3975ea'
                                                            icon="fa-solid fa-ellipsis-vertical"
                                                            onClick={() => { setShow(true) }}
                                                        />
                                                    </OverlayTrigger> : <></>}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}


                                {info.data.tasks && taskSelected !== null ? (
                                    <TaskHistory
                                        show={modalShow}
                                        id={info.teammateId}
                                        onHide={() => { setModalShow(false); setTaskSelected(null); }}
                                        indexselected={taskSelected}
                                        teamtasks={info.data.tasks}
                                        name={info.data.name}
                                        managerid={props?.managerId}
                                        teammateindex={info.teammateIndex}
                                        designation={info.data.designation}

                                    />
                                ) : (
                                    <></>
                                )}
                                {switchTask &&
                                    <SwitchTask
                                    show={true}
                                    setswitchtask={setSwitchTask}
                                    prevtasklist={info.data}
                                    props={props}
                                    manager={props?.manager}
                                    managerid={props?.managerId}
                                    switchtask={switchTask}
                                    handledeletetask={handleDeleteSwitchTask}
                                    prevteammateindex={prevTeammateIndex}
                                    prevteammateid={prevTeammateId}
                                    prevtaskindex={prevTaskIndex}
                                    />}
                            </>
                        )
                    })}
                        </TableBody></Table></Col></Row></div></>
    )
}
