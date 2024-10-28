import { FormattedMessage } from "react-intl"; /**
 * Created by 0ckdz1h9FHeqM2g on 2017-02-15.
 */
// 1. 외부 라이브러리  (외부 모듈과 내부 모듈을 구분하여 선언)
import React, { Component } from "react";
// 2. 유틸리티
import StringUtil from "../Util/StringUtil";
import FormValueUtil from "../Util/FormValueUtil";
// 3. 컴포넌트
import LUXButton from "luna-rocket/LUXButton";
import LUXTextField from "luna-rocket/LUXTextField";
import LUXToggle from "luna-rocket/LUXToggle";
import LUXAlert from "luna-rocket/LUXDialog/LUXAlert";
import LUXDialog from "luna-rocket/LUXDialog";

class ItemMngForm extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    onClose = () => {
        this.props.onClose();
    };
    saveItem = (TB_ITEM) => {
        this.props.saveItem(TB_ITEM, this.props.mode);
    };
    render() {
        return (
            <div>
                <ItemMngFormContents
                    onClose={this.onClose}
                    mode={this.props.mode}
                    TB_ITEM={this.props.TB_ITEM}
                    TB_ITEM_LIST={this.props.TB_ITEM_LIST}
                    saveItem={this.saveItem}
                />
            </div>
        );
    }
}

class ItemMngFormContents extends Component {
    constructor(props) {
        super(props);
        this.state = {
            CD_ITEM: {
                checkData: null,
                checkDataClean: false,
                infoText: this.props.mode == "insert" ? CD_ITEM_INFO.infoTextErr2 : CD_ITEM_INFO.infoText,
            },
            NM_ITEM: {
                checkData: null,
                checkDataClean: false,
                infoText: this.props.mode == "insert" ? NM_ITEM_INFO.infoTextErr2 : NM_ITEM_INFO.infoText,
            },
            ITEM_STD: {
                checkData: null,
                checkDataClean: false,
                infoText: ITEM_STD_INFO.infoText,
            },
            UM: {
                checkData: null,
                checkDataClean: false,
                infoText: UM_INFO.infoText,
            },
            DC_RMK: {
                checkData: null,
                checkDataClean: false,
                infoText: DC_RMK_INFO.infoText,
            },
            YN_USE: this.props.TB_ITEM.YN_USE,
        };
    }

    /*저장*/
    handleSave = () => {
        let { TB_ITEM_LIST } = this.props;
        let TB_ITEM_ORI = this.props.TB_ITEM;
        let TB_ITEM = [];

        let CD_ITEM = FormValueUtil.getLUXTextField(this.refs.txtCdItem);
        let NM_ITEM = FormValueUtil.getLUXTextField(this.refs.txtNmItem);
        let ITEM_STD = FormValueUtil.getLUXTextField(this.refs.txtItemStd);
        let UM = FormValueUtil.getLUXTextField(this.refs.txtUm);
        let DC_RMK = FormValueUtil.getLUXTextField(this.refs.txtDcRmk);

        /*필수입력 값 체크*/
        /*CD_ITEM*/
        let isOverlap = false;
        let isNew = TB_ITEM_ORI.CD_ITEM == "" ? true : false;

        if (TB_ITEM_LIST != null && TB_ITEM_LIST.length > 0) {
            if (isNew) {
                for (let i = 0; TB_ITEM_LIST.length > i; i++) {
                    if (TB_ITEM_LIST[i].CD_ITEM == CD_ITEM) {
                        isOverlap = true;
                        break;
                    }
                }
            } else {
                for (let i = 0; TB_ITEM_LIST.length > i; i++) {
                    if (TB_ITEM_LIST[i].CD_ITEM == CD_ITEM && TB_ITEM_ORI.CD_ITEM != CD_ITEM) {
                        isOverlap = true;
                        break;
                    }
                }
            }
        }

        let obj_CD_ITEM = {};
        if (CD_ITEM.length == 0) {
            obj_CD_ITEM = {
                checkData: "Error",
                infoText: CD_ITEM_INFO.infoTextErr2,
            };
        } else if (StringUtil.getStringToByte(CD_ITEM) > 40) {
            obj_CD_ITEM = {
                checkData: "Error",
                infoText: CD_ITEM_INFO.infoTextErr1,
            };
        } else if (isOverlap) {
            obj_CD_ITEM = {
                checkData: "Error",
                infoText: CD_ITEM_INFO.infoTextErr3,
            };
        } else {
            obj_CD_ITEM = {
                checkDataClean: true,
                infoText: CD_ITEM_INFO.infoText,
            };
        }
        this.setState({
            CD_ITEM: obj_CD_ITEM,
        });

        /*NM_ITEM*/
        let obj_NM_ITEM = {};
        if (NM_ITEM.length == 0) {
            obj_NM_ITEM = {
                checkData: "Error",
                infoText: NM_ITEM_INFO.infoTextErr2,
            };
        } else if (StringUtil.getStringToByte(NM_ITEM) > 80) {
            obj_NM_ITEM = {
                checkData: "Error",
                infoText: NM_ITEM_INFO.infoTextErr1,
            };
        } else {
            obj_NM_ITEM = {
                checkDataClean: true,
                infoText: NM_ITEM_INFO.infoText,
            };
        }
        this.setState({
            NM_ITEM: obj_NM_ITEM,
        });

        if (obj_CD_ITEM.checkData == "Error" || obj_NM_ITEM.checkData == "Error") {
            LUXDialog.alert("필수값이 누락되었거나 형식이 잘못되었습니다.", { type: "error" });
            return;
        }

        if (
            this.state.CD_ITEM.checkData != "Error" &&
            this.state.NM_ITEM.checkData != "Error" &&
            this.state.ITEM_STD.checkData != "Error" &&
            this.state.UM.checkData != "Error" &&
            this.state.DC_RMK.checkData != "Error"
        ) {
            let obj = {
                NO_ITEM: this.props.TB_ITEM.NO_ITEM != null ? this.props.TB_ITEM.NO_ITEM : "",
                CD_ITEM: CD_ITEM,
                NM_ITEM: NM_ITEM,
                ITEM_STD: ITEM_STD,
                UM: UM,
                DC_RMK: DC_RMK,
                YN_USE: this.state.YN_USE,
            };

            TB_ITEM.push(obj);

            this.props.saveItem(TB_ITEM);
        } else {
            LUXDialog.alert("필수값이 누락되었거나 형식이 잘못되었습니다.", { type: "error" });
            return;
        }
    };
    /*Validation Check*/
    handleOnChange = (id, event, value) => {
        if (id == "txtCdItem") {
            /*품목코드 중복체크*/
            let isOverlap = false;
            let { TB_ITEM_LIST } = this.props;
            let { TB_ITEM } = this.props;
            if (TB_ITEM_LIST != null && TB_ITEM_LIST.length > 0) {
                for (let i = 0; TB_ITEM_LIST.length > i; i++) {
                    if (TB_ITEM_LIST[i].CD_ITEM == value && TB_ITEM.CD_ITEM != value) {
                        isOverlap = true;
                        break;
                    }
                }
            }
            //쉼표, ~ 등 특정 특수문자 제한 정규식
            const regEx = /^[a-zA-Z0-9ㄱ-ㅎ가-힣一-鿐!@#$^&%*()+=\-_\[\]/{}|:;<>?.'"\\]+$/;

            if (value.length == 0) {
                let obj = {
                    checkData: "Error",
                    infoText: CD_ITEM_INFO.infoTextErr2,
                };
                this.setState({
                    CD_ITEM: obj,
                });
            } else if (StringUtil.getStringToByte(value) > 40) {
                let obj = {
                    checkData: "Error",
                    infoText: CD_ITEM_INFO.infoTextErr1,
                };
                this.setState({
                    CD_ITEM: obj,
                });
            } else if (!regEx.test(value)) {
                //쉼표, ~ 등 특정 특수문자 제한
                let obj = {
                    checkData: "Error",
                    infoText: CD_ITEM_INFO.infoTextErr2,
                };
                this.setState({
                    CD_ITEM: obj,
                });
            } else if (isOverlap) {
                let obj = {
                    checkData: "Error",
                    infoText: CD_ITEM_INFO.infoTextErr3,
                };
                this.setState({
                    CD_ITEM: obj,
                });
            } else {
                let obj = {
                    checkDataClean: true,
                    infoText: CD_ITEM_INFO.infoText,
                };
                this.setState({
                    CD_ITEM: obj,
                });
            }
        } else if (id == "txtNmItem") {
            if (value.length == 0) {
                let obj = {
                    checkData: "Error",
                    infoText: NM_ITEM_INFO.infoTextErr2,
                };
                this.setState({
                    NM_ITEM: obj,
                });
            } else if (StringUtil.getStringToByte(value) > 80) {
                let obj = {
                    checkData: "Error",
                    infoText: NM_ITEM_INFO.infoTextErr1,
                };
                this.setState({
                    NM_ITEM: obj,
                });
            } else {
                let obj = {
                    checkDataClean: true,
                    infoText: NM_ITEM_INFO.infoText,
                };
                this.setState({
                    NM_ITEM: obj,
                });
            }
        } else if (id == "txtItemStd") {
            if (StringUtil.getStringToByte(value) > 60) {
                let obj = {
                    checkData: "Error",
                    infoText: ITEM_STD_INFO.infoTextErr1,
                };
                this.setState({
                    ITEM_STD: obj,
                });
            } else {
                let obj = {
                    checkDataClean: true,
                    infoText: ITEM_STD_INFO.infoText,
                };
                this.setState({
                    ITEM_STD: obj,
                });
            }
        } else if (id == "txtUm") {
            if (StringUtil.getStringToByte(value) > 13) {
                let obj = {
                    checkData: "Error",
                    infoText: UM_INFO.infoTextErr1,
                };
                this.setState({
                    UM: obj,
                });
            } else if (isNaN(value)) {
                let obj = {
                    checkData: "Error",
                    infoText: UM_INFO.infoTextErr2,
                };
                this.setState({
                    UM: obj,
                });
            } else {
                let obj = {
                    checkDataClean: true,
                    infoText: UM_INFO.infoText,
                };
                this.setState({
                    UM: obj,
                });
            }
        } else if (id == "txtDcRmk") {
            if (StringUtil.getStringToByte(value) > 500) {
                let obj = {
                    checkData: "Error",
                    infoText: DC_RMK_INFO.infoTextErr1,
                };
                this.setState({
                    DC_RMK: obj,
                });
            } else {
                let obj = {
                    checkDataClean: true,
                    infoText: DC_RMK_INFO.infoText,
                };
                this.setState({
                    DC_RMK: obj,
                });
            }
        }
    };
    onUseSwitched = (checked, id) => {
        if (checked) {
            this.setState({
                YN_USE: "Y",
            });
        } else {
            this.setState({
                YN_USE: "N",
            });
        }
    };

    errorCallbackButton = () => {
        this.setState({ errorAlertOpen: false });
    };

    errorClose = (event, type) => {
        if (type === "esc") {
            this.setState({ errorAlertOpen: false });
        } else if (type === "space") {
            this.setState({ errorAlertOpen: false });
        } else if (type === "request") {
            this.setState({ errorAlertOpen: false });
        }
    };
    render() {
        return (
            <div className="snbnext">
                <div className="container">
                    <div className="containerin">
                        <div className="content">
                            <div className="cs"></div>
                            <div className="LUX_basic_rnb open_rnb">
                                <div className="dimmed" onClick={this.props.onClose} />
                                <div className="rnb">
                                    <div className="rnbtit">
                                        <h1>{this.props.mode == "insert" ? "품목 추가" : "품목 내용"}</h1>
                                        <div className="btnbx">
                                            <button className="LUX_basic_btn Image btn_clr" type="button" onClick={this.props.onClose}>
                                                <span className="sp_lux">
                                                    <FormattedMessage id="invoice.WatchDialog.Text003" defaultMessage="닫기" />
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rnbin">
                                        <div className="rnbset_accordion">
                                            <div className="rnbset_tit">
                                                <h2>
                                                    <FormattedMessage
                                                        id="invoice.ETaxFormItemGridInfo/RnbtemListGrid.text010"
                                                        defaultMessage="품목코드"
                                                    />
                                                    <span className="sp_lux">
                                                        <FormattedMessage id="invoice.ETaxForm.text061" defaultMessage="필수입력" />
                                                    </span>
                                                </h2>
                                            </div>
                                            <div className="rnbset_bx">
                                                <LUXTextField
                                                    ref="txtCdItem"
                                                    defaultValue={this.props.TB_ITEM.CD_ITEM}
                                                    useInfo={true}
                                                    checkData={this.state.CD_ITEM.checkData}
                                                    checkDataClean={this.state.CD_ITEM.checkDataClean}
                                                    informationText={this.state.CD_ITEM.infoText}
                                                    onChange={this.handleOnChange.bind(this, "txtCdItem")}
                                                    hintText={CD_ITEM_INFO.hint}
                                                    style={{ display: "inline-block", width: "370px" }}
                                                    editCheck={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="rnbset_accordion">
                                            <div className="rnbset_tit">
                                                <h2>
                                                    <FormattedMessage id="invoice.ItemMngExcelUpload.text008" defaultMessage="품목이름" />
                                                    <span className="sp_lux">
                                                        <FormattedMessage id="invoice.ETaxForm.text061" defaultMessage="필수입력" />
                                                    </span>
                                                </h2>
                                            </div>
                                            <div className="rnbset_bx">
                                                <div className="rnbset_bx">
                                                    <LUXTextField
                                                        ref="txtNmItem"
                                                        defaultValue={this.props.TB_ITEM.NM_ITEM}
                                                        useInfo={true}
                                                        checkData={this.state.NM_ITEM.checkData}
                                                        checkDataClean={this.state.NM_ITEM.checkDataClean}
                                                        informationText={this.state.NM_ITEM.infoText}
                                                        onChange={this.handleOnChange.bind(this, "txtNmItem")}
                                                        hintText={NM_ITEM_INFO.hint}
                                                        style={{ display: "inline-block", width: "370px" }}
                                                        editCheck={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rnbset_accordion">
                                            <div className="rnbset_tit">
                                                <h2>
                                                    <FormattedMessage id="invoice.docItem.unit" defaultMessage="규격" />
                                                </h2>
                                            </div>
                                            <div className="rnbset_bx">
                                                <LUXTextField
                                                    ref="txtItemStd"
                                                    defaultValue={this.props.TB_ITEM.ITEM_STD}
                                                    useInfo={true}
                                                    checkData={this.state.ITEM_STD.checkData}
                                                    checkDataClean={this.state.ITEM_STD.checkDataClean}
                                                    informationText={this.state.ITEM_STD.infoText}
                                                    onChange={this.handleOnChange.bind(this, "txtItemStd")}
                                                    hintText={ITEM_STD_INFO.hint}
                                                    style={{ display: "inline-block", width: "370px" }}
                                                    editCheck={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="rnbset_accordion">
                                            <div className="rnbset_tit">
                                                <h2>
                                                    <FormattedMessage id="invoice.docItem.unitPrice" defaultMessage="단가" />
                                                </h2>
                                            </div>
                                            <div className="rnbset_bx">
                                                <LUXTextField
                                                    ref="txtUm"
                                                    defaultValue={Number(this.props.TB_ITEM.UM)}
                                                    useInfo={true}
                                                    checkData={this.state.UM.checkData}
                                                    checkDataClean={this.state.UM.checkDataClean}
                                                    informationText={this.state.UM.infoText}
                                                    onChange={this.handleOnChange.bind(this, "txtUm")}
                                                    hintText={UM_INFO.hint}
                                                    style={{ display: "inline-block", width: "370px" }}
                                                    editCheck={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="rnbset_accordion">
                                            <div className="rnbset_tit">
                                                <h2>
                                                    <FormattedMessage id="invoice.document.remarks" defaultMessage="비고" />
                                                </h2>
                                            </div>
                                            <div className="rnbset_bx">
                                                <LUXTextField
                                                    ref="txtDcRmk"
                                                    defaultValue={this.props.TB_ITEM.DC_RMK}
                                                    useInfo={true}
                                                    checkData={this.state.DC_RMK.checkData}
                                                    checkDataClean={this.state.DC_RMK.checkDataClean}
                                                    informationText={this.state.DC_RMK.infoText}
                                                    onChange={this.handleOnChange.bind(this, "txtDcRmk")}
                                                    hintText={DC_RMK_INFO.hint}
                                                    style={{ display: "inline-block", width: "370px" }}
                                                    editCheck={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="rnbset_accordion">
                                            <div className="rnbset_tit">
                                                <h2>
                                                    <FormattedMessage id="invoice.ItemMngForm.text009" defaultMessage="사용여부" />
                                                </h2>
                                            </div>
                                            <div className="rnbset_bx">
                                                <LUXToggle
                                                    id="itemToggle"
                                                    switchOn={this.props.TB_ITEM.YN_USE == "Y" ? true : false}
                                                    onSwitch={this.onUseSwitched}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rnbbtn">
                                        <div className="fltrgt">
                                            <LUXButton label="취소" type="confirm" onTouchTap={this.props.onClose} />
                                            <LUXButton label="저장" type="confirm" blue={true} onTouchTap={this.handleSave} />
                                        </div>
                                    </div>
                                </div>

                                {/*Component*/}
                                <LUXAlert
                                    message="잘못된 입력값이 존재합니다."
                                    useIcon={true}
                                    useIconType="error"
                                    open={this.state.errorAlertOpen}
                                    confirmButton={this.errorCallbackButton}
                                    onClose={this.errorClose}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const CD_ITEM_INFO = {
    infoText: "품목코드는 20자 이하로 입력해주세요. 쉼표(,)는 입력이 불가합니다. ",
    infoTextErr1: "크기가 20자를 초과하였습니다.",
    infoTextErr2: "품목코드는 필수 입력사항 입니다. 쉼표(,)는 입력이 불가합니다.",
    infoTextErr3: "중복된 품목코드가 존재합니다.",
    hint: "품목코드를 입력해주세요.",
};
const NM_ITEM_INFO = {
    infoText: "품목이름은 40자 이하로 입력해주세요",
    infoTextErr1: "크기가 40자를 초과하였습니다.",
    infoTextErr2: "품목이름은 필수 입력사항 입니다.",
    hint: "품목이름을 입력해주세요.",
};
const ITEM_STD_INFO = {
    infoText: "규격은 30자 이하로 입력해주세요",
    infoTextErr1: "크기가 30자를 초과하였습니다.",
    hint: "규격을 입력해주세요.",
};
const UM_INFO = {
    infoText: "단가는 13자 이하로 입력해주세요",
    infoTextErr1: "크기가 13자를 초과하였습니다.",
    infoTextErr2: "숫자만 입력 가능합니다.",
    hint: "단가를 입력해주세요.",
};
const DC_RMK_INFO = {
    infoText: "비고는 250자 이하로 입력해주세요",
    infoTextErr1: "크기가 250자를 초과하였습니다.",
    hint: "비고를 입력해주세요.",
};

export default ItemMngForm;