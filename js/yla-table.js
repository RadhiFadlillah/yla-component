var YlaTable = function () {
    // Private methods
    function _getNested(obj /*, ...levels*/ ) {
        for (var i = 1; i < arguments.length; i++) {
            obj = obj[arguments[i]];
            if (!obj) return undefined;
        }

        return obj;
    }

    function _addDataRowIndex(vnode, idx) {
        // Set default parameter
        vnode = vnode || '';
        idx = idx || 0;

        // Make sure this vnode is element
        if (!vnode.tag) return;

        // If this vnode has event handler, add data-row attribute
        var data = vnode.data || {},
            attrs = data.attrs || {},
            event = data.on;

        if (event) {
            attrs['data-row'] = idx;
            data.attrs = attrs;
            vnode.data = data;
        }

        // Do the same for all children of vnode
        if (vnode.children) vnode.children.forEach(vnode => _addDataRowIndex(vnode, idx));
    }

    function _tableScrollHandler(e) {
        var body = e.target || {},
            header = body.previousElementSibling || {},
            footer = body.nextElementSibling || {},
            scrollLeft = body.scrollLeft || 0;

        header.scrollLeft = scrollLeft;
        footer.scrollLeft = scrollLeft;
    }

    function _resizeTableColumn(table, tableData, columnsProps) {
        // Make sure the table element is exist
        if (!table) return;

        // Set default parameter
        tableData = tableData || [];
        columnsProps = columnsProps || [];

        // Fetch sub element of the table
        var header = table.querySelector('.yla-table__header'),
            body = table.querySelector('.yla-table__body'),
            footer = table.querySelector('.yla-table__footer');

        // At least header and body must exist
        if (!header || !body) return;

        // Clear existing column width
        var nColumn = columnsProps.length;
        for (var i = 0; i < nColumn; i++) {
            var headerCell, bodyCell, footerCell;

            headerCell = header.children[i];
            bodyCell = body.children[i];
            if (footer) footerCell = footer.children[i];

            if (headerCell) headerCell.style.width = null;
            if (bodyCell) bodyCell.style.width = null;
            if (footerCell) footerCell.style.width = null;
        }

        // Make sure table data is not empty
        if (tableData.length === 0) return;

        // Set new column width
        for (var i = 0; i < nColumn; i++) {
            // If this column fill the table width, don't set the size
            var columnProps = columnsProps[i] || {};
            if (columnProps.fillWidth === true) continue;

            // Fetch cells
            var headerCell, bodyCell, footerCell, maxWidth;
            headerCell = header.children[i];
            bodyCell = body.children[i];
            if (footer) footerCell = footer.children[i];

            // Compare the largest width
            if (headerCell) maxWidth = headerCell.offsetWidth;
            if (bodyCell && bodyCell.offsetWidth > maxWidth) maxWidth = bodyCell.offsetWidth;
            if (footerCell && footerCell.offsetWidth > maxWidth) maxWidth = footerCell.offsetWidth;

            // Set the max width
            if (headerCell) headerCell.style.width = maxWidth + 'px';
            if (bodyCell) bodyCell.style.width = maxWidth + 'px';
            if (footerCell) footerCell.style.width = maxWidth + 'px';
        }
    }

    function _generateColumnsProps(nodes) {
        // Set default parameter
        nodes = nodes || [];

        // Initiate variables
        var columnsProps = [];

        // Generate header and column properties from each node
        nodes.forEach(node => {
            // Make sure it is column
            if (node.tag !== 'yla-table-column') return;

            // Parse column attributes
            var attrs = _getNested(node, 'data', 'attrs') || {},
                prop = attrs.prop || '',
                align = attrs.align || '',
                label = attrs.label || '',
                width = attrs.width || 'auto',
                minWidth = attrs['min-width'] || '';

            // Check if this column has custom header or body
            var customElements = node.children || [],
                customHeader, customBody;

            customElements.forEach(elem => {
                var slot = _getNested(elem, 'data', 'slot');
                if (slot === 'custom-header') customHeader = elem;
                else if (slot === 'custom-body') customBody = elem;
            });

            if (customHeader) {
                if (customHeader.tag === 'template') customHeader = customHeader.children || [];
                if (customHeader.constructor !== Array) customHeader = [customHeader];
                label = customHeader;
            }

            if (customBody) {
                if (customBody.tag === 'template') customBody = customBody.children || [];
                if (customBody.constructor !== Array) customBody = [customBody];
            }

            // Generate grid template column width
            var gridTemplate;
            if (width === 'content') gridTemplate = 'minmax(min-content, max-content)';
            else {
                var rxSizeUnit = /^\d+(px|em|vw|vh|vm|%)?$/g,
                    widthIsSize = rxSizeUnit.test(width),
                    minWidthIsSize = rxSizeUnit.test(minWidth),
                    min = 'min-content',
                    max = '1fr';

                if (widthIsSize) max = width;
                if (minWidthIsSize) min = minWidth;

                gridTemplate = 'minmax(' + min + ',' + max + ')';
            }

            // Save column properties
            columnsProps.push({
                prop: prop,
                align: align,
                header: label,
                fillWidth: width === 'auto',
                gridTemplate: gridTemplate,
                customBody: customBody,
            });
        });

        return columnsProps;
    }

    function _generateHeader(columnsProps, fnCreateElement) {
        // Set default parameter
        columnsProps = columnsProps || [];
        fnCreateElement = fnCreateElement || function () {};

        // Generate header cells
        var headerCells = columnsProps.map(column => fnCreateElement('div', column.header || []));

        // Generate header
        return fnCreateElement('div', {
            class: 'yla-table__header'
        }, headerCells);
    }

    function _generateBody(tableData, columnsProps, fnCreateElement, emptyMessage) {
        // Set default parameter
        tableData = tableData || [];
        columnsProps = columnsProps || [];
        fnCreateElement = fnCreateElement || function () {};
        emptyMessage = emptyMessage || 'There are no data available';

        // Generate body cells
        var bodyCells = [];
        tableData.forEach((item, idx) => {
            columnsProps.forEach(column => {
                var dataProp = column.prop || '',
                    textAlignment = column.align || '',
                    cellContent = item[dataProp] || '',
                    classes = [];

                // Make sure cell content is array
                cellContent = [cellContent];

                // Set cell text alignment
                if (textAlignment === 'center') classes.push('center');
                else if (textAlignment === 'right') classes.push('right');

                // Check if it uses custom cell content
                if (column.customBody) {
                    cellContent = column.customBody;
                    cellContent.forEach(elem => _addDataRowIndex(elem, idx));
                }

                // Create body cell
                bodyCells.push(fnCreateElement('div', {
                    class: classes.join(' '),
                }, cellContent));
            });
        });

        // If the table data is empty, write empty message
        if (tableData.length === 0) {
            // Make sure empty message is Array
            if (emptyMessage.constructor !== Array) emptyMessage = [emptyMessage];

            // Create empty message cell
            bodyCells.push(fnCreateElement('div', {
                class: 'center',
                style: {
                    gridColumn: '1/-1'
                }
            }, emptyMessage));
        }

        // Generate body
        return fnCreateElement('div', {
            class: 'yla-table__body',
            on: {
                scroll: _tableScrollHandler
            }
        }, bodyCells);
    }

    function _generateFooter(summaryData, columnsProps, fnCreateElement) {
        // Set default parameter
        summaryData = summaryData || {};
        columnsProps = columnsProps || [];
        fnCreateElement = fnCreateElement || function () {};

        // Generate footer cells
        var footerCells = columnsProps.map(column => {
            var dataProp = column.prop || '',
                textAlignment = column.align || '',
                cellContent = summaryData[dataProp] || '',
                className;

            // Set cell text alignment
            if (textAlignment === 'center') className = 'center';
            else if (textAlignment === 'right') className = 'right';

            return fnCreateElement('div', {
                class: className
            }, cellContent);
        });

        // Generate footer
        return fnCreateElement('div', {
            class: 'yla-table__footer'
        }, footerCells);
    }

    // Create Vue component
    return {
        props: {
            data: {
                type: Array,
                default: function () {
                    return [];
                },
            },
            summary: Object
        },
        data: function () {
            return {
                columnsProps: []
            };
        },
        watch: {
            columnsProps: function () {
                _resizeTableColumn(this.$el, this.data, this.columnsProps);
            }
        },
        mounted: function () {
            this.$nextTick(() => {
                window.addEventListener('resize', () => {
                    _resizeTableColumn(this.$el, this.data, this.columnsProps);
                });
            });
        },
        render: function (createElement) {
            // Read component props
            var tableData = this.data,
                tableSummary = this.summary;

            // Generate column props from elements in slot
            var columnsProps = _generateColumnsProps(this.$slots.default);
            this.columnsProps = columnsProps;

            // Make sure there are existing columns
            if (columnsProps.length === 0) return;

            // Generate header and body
            var header = _generateHeader(columnsProps, createElement),
                body = _generateBody(tableData, columnsProps, createElement, this.$slots.empty),
                tableContents = [header, body];

            // Generate footer if needed
            if (tableData.length > 0 && tableSummary) {
                var footer = _generateFooter(tableSummary, columnsProps, createElement);
                tableContents.push(footer);
            }

            // Create final table
            var templateColumns = [];
            columnsProps.forEach(column => {
                templateColumns.push(column.gridTemplate || '');
            });

            return createElement(
                'div', {
                    class: 'yla-table',
                    attrs: this.$attrs,
                    style: {
                        gridTemplateColumns: templateColumns.join(' ')
                    }
                }, tableContents
            );
        }
    }
};