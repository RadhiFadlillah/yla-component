var YlaTable = function () {
    var _template = `
        <div class="yla-table">
            <div class="yla-table__header" 
                 :style="{gridTemplateColumns: headerColumnTemplate}">
                <div v-if="selectable">
                    <a class="selector" @click="toggleAllSelection">
                        <i class="far fa-fw" :class="headerSelectorIcon()"></i>
                    </a>
                </div>
                <div v-for="(col, idx) in finalColumns" 
                     :class="colClass(col)" 
                     :style="{width: colWidth(idx)}"
                     @click="sort(col)">
                    <slot :name="'header-'+col.name">{{col.label}}</slot>
                </div>
                <div></div>
            </div>
            <div class="yla-table__body" :style="{gridTemplateColumns: columnTemplate}">
                <div v-if="loading" style="grid-column: 1/-1; text-align: center">
                    <i class="fas fa-fw fa-spinner fa-spin"></i>
                </div>
                <div v-else-if="contents.length === 0" style="grid-column: 1/-1; text-align: center">
                    <slot name="empty-message">There are no data available</slot>
                </div>
                <template v-else>
                    <template>
                        <div v-if="selectable" class="hidden"></div>
                        <div v-for="col in finalColumns" class="hidden">{{col.label}}{{col.sortable ? 'XXX' : ''}}</div>
                    </template>
                    <template v-if="summary && contents.length > 0 && !loading">
                        <div v-if="selectable" class="hidden"></div>
                        <div v-for="col in finalColumns" class="hidden">{{summary[col.name]}}</div>
                    </template>
                    <template v-for="(item, idx) in contents">
                        <div v-if="selectable" class="selector" :class="{strip: (idx % 2 === 1)}">
                            <a class="menu" @click="toggleSelection(idx)">
                                <i class="far fa-fw" :class="selectorIcon(idx)"></i>
                            </a>
                        </div>
                        <div v-for="col in finalColumns" :style="{textAlign: col.align}" :class="{strip: (idx % 2 === 1)}">
                            <slot :name="'body-'+col.name" :data="item" :index="idx">{{item[col.name]}}</slot>
                        </div>
                    </template>
                </template>
            </div>
            <div class="yla-table__footer" 
                 v-if="summary && contents.length > 0 && !loading" 
                 :style="{gridTemplateColumns: headerColumnTemplate}">
                <div v-if="selectable"></div>
                <div v-for="(col, idx) in finalColumns" 
                     :style="{textAlign: col.align, width: colWidth(idx)}">
                    {{summary[col.name]}}
                </div>
                <div></div>
            </div>
        </div>`

    // Private function
    function _createColumnTemplate(width, minWidth) {
        if (width === 'content') return 'minmax(min-content, max-content)';
        if (width === 'max-content') return 'max-content';

        var rxSizeUnit = /^\d+(px|em|vw|vh|vm|%|fr)?$/g,
            widthIsSize = rxSizeUnit.test(width),
            minWidthIsSize = rxSizeUnit.test(minWidth),
            min = 'min-content',
            max = '1fr';

        if (widthIsSize) max = width;
        if (minWidthIsSize) min = minWidth;

        return 'minmax(' + min + ',' + max + ')';
    }

    function _getScrollWidth(table) {
        if (!table) return 0;

        var body = table.querySelector('.yla-table__body');
        return body.offsetWidth - body.clientWidth;
    }

    function _getColumnWidth(table, contents, selectable) {
        // Make sure the table element is exist
        if (!table) return [];

        // If there are no contents, stop
        if (contents.constructor !== Array || contents.length === 0) return [];

        // Get width of each column
        var result = [],
            header = table.querySelector('.yla-table__header'),
            body = table.querySelector('.yla-table__body'),
            nColumn = header.children.length - 1,
            start = selectable ? 1 : 0;

        for (var i = start; i < nColumn; i++) {
            var cell = body.children[i];
            if (cell) result.push(cell.offsetWidth);
        }

        return result;
    }

    function _resetScroll(table) {
        // Make sure the table element is exist
        if (!table) return;

        // Get elements
        var header = table.querySelector('.yla-table__header'),
            body = table.querySelector('.yla-table__body'),
            footer = table.querySelector('.yla-table__footer');

        // Reset scroll position
        body.scrollTop = 0;
        body.scrollLeft = 0;
        header.scrollLeft = 0;
        if (footer) footer.scrollLeft = 0;
    }

    // Create Vue component
    return {
        template: _template,
        props: {
            loading: Boolean,
            selectable: {
                type: Boolean,
                default: false
            },
            columns: {
                type: Array,
                required: true
            },
            contents: {
                type: Array,
                required: true
            },
            summary: Object
        },
        data() {
            return {
                scrollWidth: 0,
                columnsWidth: [],
                selected: [],
                sortColumn: '',
                sortDirection: ''
            }
        },
        computed: {
            columnTemplate() {
                var templates = this.columns
                    .map(col => _createColumnTemplate(col.width, col.minWidth));

                if (this.selectable) templates.unshift('60px');
                return templates.join(' ');
            },
            headerColumnTemplate() {
                var templates = this.columns
                    .map(col => _createColumnTemplate(col.width, col.minWidth));

                if (this.selectable) templates.unshift('60px');
                templates.push(this.scrollWidth + 'px');
                return templates.join(' ');
            },
            finalColumns() {
                return this.columns.map((col, idx) => {
                    var name = col.name || 'col-' + idx,
                        label = col.label || '',
                        sortName = col.sortName || name,
                        textAlignment = col.align;

                    if (textAlignment !== 'center' && textAlignment !== 'right') {
                        textAlignment = undefined;
                    }

                    return {
                        name: name,
                        label: label,
                        sortable: col.sortable === true,
                        sortName: sortName,
                        width: col.width,
                        minWidth: col.minWidth,
                        align: textAlignment
                    }
                });
            }
        },
        watch: {
            contents: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        this.scrollWidth = _getScrollWidth(this.$el);
                        this.columnsWidth = _getColumnWidth(this.$el, this.contents, this.selectable);
                        _resetScroll(this.$el);
                    });
                }
            },
            summary: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        this.columnsWidth = _getColumnWidth(this.$el, this.contents, this.selectable);
                    });
                }
            }
        },
        methods: {
            headerSelectorIcon() {
                if (this.selected.length === 0) return 'fa-square';
                if (this.selected.length < this.contents.length) return 'fa-minus-square';
                return 'fa-check-square';
            },
            selectorIcon(index) {
                if (this.selected.indexOf(index) === -1) return 'fa-square';
                return 'fa-check-square';
            },
            toggleAllSelection() {
                var nSelected = this.selected.length,
                    nContent = this.contents.length;

                this.selected = [];
                if (nSelected !== nContent) {
                    for (var i = 0; i < nContent; i++) {
                        this.selected.push(i);
                    }
                }

                this.$emit('selected', this.selected);
            },
            toggleSelection(index) {
                var pos = this.selected.indexOf(index);

                if (pos !== -1) this.selected.splice(index, 1);
                else {
                    this.selected.push(index);
                    this.selected.sort();
                }

                this.$emit('selected', this.selected);
            },
            colWidth(index) {
                var width = this.columnsWidth[index];
                if (width != null) width += 'px';
                return width;
            },
            colClass(column) {
                var columnName = column.sortName || column.name,
                    isSorted = columnName === this.sortColumn,
                    isDescending = this.sortDirection === 'desc';

                return {
                    sortable: column.sortable,
                    sorted: isSorted,
                    desc: isSorted && isDescending
                }
            },
            sort(column) {
                if (!column.sortable) return;

                var columnName = column.sortName || column.name;
                if (columnName !== this.sortColumn) {
                    this.sortColumn = columnName;
                    this.sortDirection = 'desc';
                } else {
                    if (this.sortDirection === 'desc') {
                        this.sortDirection = 'asc';
                    } else {
                        this.sortDirection = 'desc';
                    }
                }

                this.selected = [];
                this.$emit('selected', this.selected);
                this.$emit('sort', this.sortColumn + ' ' + this.sortDirection);
            }
        },
        mounted() {
            this.$nextTick(() => {
                var header = this.$el.querySelector('.yla-table__header'),
                    body = this.$el.querySelector('.yla-table__body');

                body.addEventListener('scroll', (e) => {
                    var footer = this.$el.querySelector('.yla-table__footer');

                    header.scrollLeft = body.scrollLeft;
                    if (footer) footer.scrollLeft = body.scrollLeft;
                });

                window.addEventListener('resize', () => {
                    this.scrollWidth = _getScrollWidth(this.$el);
                    this.columnsWidth = _getColumnWidth(this.$el, this.contents, this.selectable);
                    _resetScroll(this.$el);
                });
            });
        },
        activated() {
            this.$nextTick(() => {
                this.scrollWidth = _getScrollWidth(this.$el);
                this.columnsWidth = _getColumnWidth(this.$el, this.contents, this.selectable);
            });
        }
    }
};