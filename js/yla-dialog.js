var YlaDialog = function () {
    // Private variable
    var _template = `
        <div v-if="visible" class="yla-dialog__overlay">
            <div class="yla-dialog">
                <div class="yla-dialog__header">
                    <p>{{title}}</p>
                </div>
                <div class="yla-dialog__body">
                    <slot name="custom-body">
                        <p class="yla-dialog__content">{{content}}</p>
                        <template v-for="field in formFields" class="yla-dialog__field">
                            <p v-if="showLabel">{{field.label}} :</p>
                            <input :style="{gridColumnEnd: showLabel ? null : 'span 2'}" 
                                   :type="fieldType(field)" 
                                   :placeholder="field.label" 
                                   v-model="field.value" 
                                   @keyup.enter="handleMainClick">
                        </template>
                    </slot>
                </div>
                <div class="yla-dialog__footer">
                    <i v-if="loading" class="fas fa-fw fa-spinner fa-spin"></i>
                    <slot v-else name="custom-footer">
                        <a v-if="secondText" @click="handleSecondClick" class="yla-dialog__button">{{secondText}}</a>
                        <a @click="handleMainClick" class="yla-dialog__button main">{{mainText}}</a>
                    </slot>
                </div>
            </div>
        </div>`;

    return {
        template: _template,
        props: {
            visible: Boolean,
            loading: Boolean,
            title: {
                type: String,
                default: ''
            },
            content: {
                type: String,
                default: ''
            },
            fields: {
                type: Array,
                default () {
                    return []
                }
            },
            showLabel: {
                type: Boolean,
                default: false
            },
            mainText: {
                type: String,
                default: 'OK'
            },
            secondText: String,
            mainClick: {
                type: Function,
                default () {}
            },
            secondClick: {
                type: Function,
                default () {}
            }
        },
        data() {
            return {
                formFields: []
            };
        },
        watch: {
            fields: {
                immediate: true,
                handler() {
                    this.formFields = this.fields.map(field => {
                        if (typeof field === 'string') return {
                            name: field,
                            label: field,
                            value: '',
                            type: 'text',
                        }

                        if (typeof field === 'object') return {
                            name: field.name || '',
                            label: field.label || '',
                            value: field.value || '',
                            type: field.type || 'text',
                        }
                    });
                }
            }
        },
        methods: {
            fieldType(f) {
                var type = f.type || 'text';
                if (type !== 'text' && type !== 'password') return 'text';
                else return type;
            },
            handleMainClick() {
                var data = {};
                this.formFields.forEach(field => {
                    var value = field.value;
                    if (field.type === 'number') value = parseInt(value, 10) || 0;
                    data[field.name] = value;
                })
                this.mainClick(data);
            },
            handleSecondClick() {
                this.secondClick();
            }
        }
    };
};