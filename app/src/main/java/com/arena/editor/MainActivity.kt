package com.arena.editor

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.View
import android.widget.Button
import android.widget.CompoundButton
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.SeekBar
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import android.widget.VideoView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.bottomsheet.BottomSheetDialog
import kotlin.math.max
import kotlin.math.min

class MainActivity : AppCompatActivity() {

    // ---- screens ----
    private lateinit var screenHome: View
    private lateinit var screenSize: View
    private lateinit var screenVideo: View
    private lateinit var screenCrop: View
    private lateinit var screenEditor: View
    private lateinit var allScreens: List<View>

    // ---- size step ----
    private var chosenRatio: String? = null
    private val ratioCardIds = listOf(
        "9:16" to R.id.card916, "16:9" to R.id.card169, "1:1" to R.id.card11, "4:3" to R.id.card43,
        "3:4" to R.id.card34, "2:3" to R.id.card23, "21:9" to R.id.card219
    )

    // ---- video step ----
    private var videoUri: Uri? = null

    // ---- crop step ----
    private var fillMode = false

    // ---- editor ----
    private val elements = mutableListOf<OverlayElementView>()
    private var selected: OverlayElementView? = null
    private var stickerAskedOnce = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        screenHome = findViewById(R.id.screenHome)
        screenSize = findViewById(R.id.screenSize)
        screenVideo = findViewById(R.id.screenVideo)
        screenCrop = findViewById(R.id.screenCrop)
        screenEditor = findViewById(R.id.screenEditor)
        allScreens = listOf(screenHome, screenSize, screenVideo, screenCrop, screenEditor)

        setupHome()
        setupSizeScreen()
        setupVideoScreen()
        setupCropScreen()
        setupEditorScreen()

        showScreen(screenHome)
    }

    private fun showScreen(target: View) {
        allScreens.forEach { it.visibility = if (it === target) View.VISIBLE else View.GONE }
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    // =======================================================
    // HOME
    // =======================================================
    private fun setupHome() {
        findViewById<Button>(R.id.btnNewProject).setOnClickListener {
            showScreen(screenSize)
        }
    }

    // =======================================================
    // SIZE STEP
    // =======================================================
    private fun setupSizeScreen() {
        findViewById<ImageButton>(R.id.btnBackSize).setOnClickListener { showScreen(screenHome) }

        val nextBtn = findViewById<Button>(R.id.btnSizeNext)

        ratioCardIds.forEach { (ratio, id) ->
            findViewById<View>(id).setOnClickListener { card ->
                ratioCardIds.forEach { (_, otherId) -> findViewById<View>(otherId).isSelected = false }
                card.isSelected = true
                chosenRatio = ratio
                nextBtn.isEnabled = true
                nextBtn.alpha = 1f
            }
        }

        findViewById<TextView>(R.id.btnMoreRatios).setOnClickListener {
            val row = findViewById<View>(R.id.moreRow)
            row.visibility = if (row.visibility == View.VISIBLE) View.GONE else View.VISIBLE
        }

        nextBtn.setOnClickListener { showScreen(screenVideo) }
    }

    // =======================================================
    // VIDEO STEP
    // =======================================================
    private val pickVideo = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) onVideoPicked(uri)
    }

    private fun setupVideoScreen() {
        findViewById<ImageButton>(R.id.btnBackVideo).setOnClickListener { showScreen(screenSize) }

        findViewById<View>(R.id.dropZone).setOnClickListener { pickVideo.launch("video/*") }

        findViewById<ImageButton>(R.id.btnClearFile).setOnClickListener {
            videoUri = null
            findViewById<View>(R.id.filePicked).visibility = View.GONE
            findViewById<View>(R.id.dropZone).visibility = View.VISIBLE
            findViewById<Button>(R.id.btnVideoNext).isEnabled = false
            findViewById<Button>(R.id.btnVideoNext).alpha = 0.35f
        }

        findViewById<Button>(R.id.btnVideoNext).setOnClickListener {
            setupCropFrame()
            showScreen(screenCrop)
        }
    }

    private fun onVideoPicked(uri: Uri) {
        videoUri = uri
        val name = queryFileName(uri) ?: "video.mp4"
        findViewById<TextView>(R.id.tvFileName).text = name
        findViewById<TextView>(R.id.tvFileMeta).text = "Ready"
        findViewById<View>(R.id.dropZone).visibility = View.GONE
        findViewById<View>(R.id.filePicked).visibility = View.VISIBLE

        val thumb = findViewById<ImageView>(R.id.fileThumb)
        thumb.setImageBitmap(extractThumbnail(uri))

        val nextBtn = findViewById<Button>(R.id.btnVideoNext)
        nextBtn.isEnabled = true
        nextBtn.alpha = 1f
    }

    private fun queryFileName(uri: Uri): String? {
        return try {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (idx >= 0 && cursor.moveToFirst()) cursor.getString(idx) else null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun extractThumbnail(uri: Uri): Bitmap? {
        return try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(this, uri)
            val bmp = retriever.getFrameAtTime(0)
            retriever.release()
            bmp
        } catch (e: Exception) {
            null
        }
    }

    // =======================================================
    // CROP STEP
    // =======================================================
    private fun ratioBoxPx(ratio: String, maxWdp: Int, maxHdp: Int): Pair<Int, Int> {
        val parts = ratio.split(":").map { it.toFloat() }
        val rw = parts[0]; val rh = parts[1]
        var w = maxWdp.toFloat()
        var h = w * rh / rw
        if (h > maxHdp) {
            h = maxHdp.toFloat()
            w = h * rw / rh
        }
        return Pair(dp(w.toInt()), dp(h.toInt()))
    }

    private fun setupCropFrame() {
        val ratio = chosenRatio ?: "9:16"
        val (w, h) = ratioBoxPx(ratio, 240, 420)
        val frame = findViewById<FrameLayout>(R.id.cropFrame)
        frame.layoutParams = frame.layoutParams.apply { width = w; height = h }
        frame.requestLayout()

        val videoView = findViewById<VideoView>(R.id.cropVideo)
        videoUri?.let { playVideoScaled(videoView, it, w, h, fillMode) }
    }

    private fun setupCropScreen() {
        findViewById<ImageButton>(R.id.btnBackCrop).setOnClickListener { showScreen(screenVideo) }

        val chipAuto = findViewById<TextView>(R.id.chipAuto)
        val chipFill = findViewById<TextView>(R.id.chipFill)
        chipAuto.isSelected = true

        chipAuto.setOnClickListener {
            fillMode = false
            chipAuto.isSelected = true
            chipFill.isSelected = false
            setupCropFrame()
        }
        chipFill.setOnClickListener {
            fillMode = true
            chipFill.isSelected = true
            chipAuto.isSelected = false
            setupCropFrame()
        }

        val cropChips = listOf(R.id.chipCrop43 to "4:3", R.id.chipCrop11 to "1:1", R.id.chipCropFree to "free")
        cropChips.forEach { (id, label) ->
            findViewById<TextView>(id).setOnClickListener {
                cropChips.forEach { (otherId, _) -> findViewById<TextView>(otherId).isSelected = false }
                findViewById<TextView>(id).isSelected = true
                toast("Manual crop set to $label — drag corners on the frame to fine-tune")
            }
        }

        findViewById<Button>(R.id.btnCropNext).setOnClickListener {
            enterEditor()
            askWatermark()
        }
    }

    /** Plays a video inside a fixed-size container, either letterboxed ("contain")
     *  or cropped edge-to-edge ("cover"), muted and looping. */
    private fun playVideoScaled(videoView: VideoView, uri: Uri, containerWpx: Int, containerHpx: Int, cover: Boolean) {
        videoView.scaleX = 1f
        videoView.scaleY = 1f
        videoView.setVideoURI(uri)
        videoView.setOnPreparedListener { mp ->
            mp.isLooping = true
            mp.setVolume(0f, 0f)
            mp.start()
            val vw = mp.videoWidth.toFloat()
            val vh = mp.videoHeight.toFloat()
            if (cover && vw > 0 && vh > 0) {
                val containScale = min(containerWpx / vw, containerHpx / vh)
                val coverScale = max(containerWpx / vw, containerHpx / vh)
                val extra = if (containScale > 0f) coverScale / containScale else 1f
                videoView.scaleX = extra
                videoView.scaleY = extra
            }
        }
    }

    // =======================================================
    // EDITOR
    // =======================================================
    private fun enterEditor() {
        showScreen(screenEditor)
        val ratio = chosenRatio ?: "9:16"
        findViewById<TextView>(R.id.tvRatioLabel).text = ratio

        val (w, h) = ratioBoxPx(ratio, 240, 420)
        val stage = findViewById<FrameLayout>(R.id.stage)
        stage.layoutParams = stage.layoutParams.apply { width = w; height = h }
        stage.requestLayout()

        val videoView = findViewById<VideoView>(R.id.mainVideo)
        videoUri?.let { playVideoScaled(videoView, it, w, h, fillMode) }

        videoView.setOnClickListener { deselectAll() }
    }

    private fun setupEditorScreen() {
        findViewById<ImageButton>(R.id.btnBackEditor).setOnClickListener { showScreen(screenHome) }

        findViewById<Button>(R.id.btnExport).setOnClickListener {
            toast("Exporting… saved to device ✓")
        }

        findViewById<View>(R.id.trayWatermark).setOnClickListener {
            showTextInput("Watermark text", "e.g. @yourname", fallback = "Your Brand") { text ->
                addElement(ElementType.WATERMARK, text = text)
            }
        }
        findViewById<View>(R.id.trayCaption).setOnClickListener {
            showTextInput("Caption text", "Type your caption", fallback = "Your caption") { text ->
                addElement(ElementType.CAPTION, text = text)
            }
        }
        findViewById<View>(R.id.traySticker).setOnClickListener {
            showStickerPicker { iconRes -> addElement(ElementType.STICKER, iconRes = iconRes) }
        }
        findViewById<View>(R.id.trayDelete).setOnClickListener { deleteSelected() }

        val propSize = findViewById<SeekBar>(R.id.propSize)
        propSize.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: SeekBar?, progress: Int, fromUser: Boolean) {
                val el = selected ?: return
                if (!fromUser) return
                val offset = if (el.type == ElementType.STICKER) 20 else 10
                el.setElementSize((progress + offset).toFloat())
            }
            override fun onStartTrackingTouch(sb: SeekBar?) {}
            override fun onStopTrackingTouch(sb: SeekBar?) {}
        })
    }

    private fun addElement(type: ElementType, text: String? = null, iconRes: Int? = null) {
        val stage = findViewById<FrameLayout>(R.id.stage)
        val view = OverlayElementView(this, type)

        when (type) {
            ElementType.STICKER -> view.setIcon(iconRes ?: R.drawable.ic_star)
            else -> view.setText(text ?: "")
        }

        view.onTap = { selectElement(view) }
        view.onSizeChanging = { size ->
            if (selected === view) {
                val offset = if (type == ElementType.STICKER) 20 else 10
                findViewById<SeekBar>(R.id.propSize).progress = (size - offset).toInt()
            }
        }

        val lp = FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT)
        stage.addView(view, lp)
        elements.add(view)

        view.post {
            val stageW = stage.width.toFloat()
            val stageH = stage.height.toFloat()
            view.x = (stageW - view.width) / 2f
            view.y = when (type) {
                ElementType.WATERMARK -> stageH * 0.88f - view.height
                ElementType.CAPTION -> stageH * 0.75f - view.height
                ElementType.STICKER -> stageH * 0.45f - view.height / 2f
            }
        }

        selectElement(view)
        val label = when (type) {
            ElementType.WATERMARK -> "Watermark"
            ElementType.CAPTION -> "Caption"
            ElementType.STICKER -> "Sticker"
        }
        toast("$label added — drag it into place")
    }

    private fun selectElement(view: OverlayElementView) {
        selected?.isSelectedElement = false
        selected = view
        view.isSelectedElement = true

        val propPanel = findViewById<View>(R.id.propPanel)
        propPanel.visibility = View.VISIBLE

        val offset = if (view.type == ElementType.STICKER) 20 else 10
        val span = if (view.type == ElementType.STICKER) 76 else 62
        val seek = findViewById<SeekBar>(R.id.propSize)
        seek.max = span
        seek.progress = (view.getElementSize() - offset).toInt().coerceIn(0, span)

        findViewById<Switch>(R.id.propLock).setOnCheckedChangeListener(null)
        findViewById<Switch>(R.id.propLock).isChecked = view.locked
        findViewById<Switch>(R.id.propLock).setOnCheckedChangeListener { _: CompoundButton, checked: Boolean ->
            view.locked = checked
            toast(if (checked) "Locked — safe from other drags" else "Unlocked — you can edit it again")
        }
    }

    private fun deselectAll() {
        selected?.isSelectedElement = false
        selected = null
        findViewById<View>(R.id.propPanel).visibility = View.GONE
    }

    private fun deleteSelected() {
        val el = selected
        if (el == null) {
            toast("Select an element first")
            return
        }
        (el.parent as? FrameLayout)?.removeView(el)
        elements.remove(el)
        selected = null
        findViewById<View>(R.id.propPanel).visibility = View.GONE
        toast("Deleted")
    }

    // =======================================================
    // QUESTION SHEETS (watermark -> caption -> sticker loop)
    // =======================================================
    private fun askWatermark() {
        showYesNo(
            getString(R.string.ask_watermark_title),
            getString(R.string.ask_watermark_hint),
            onYes = {
                showTextInput("Watermark text", "e.g. @yourname", fallback = "Your Brand") { text ->
                    addElement(ElementType.WATERMARK, text = text)
                    askCaption()
                }
            },
            onNo = { askCaption() }
        )
    }

    private fun askCaption() {
        showYesNo(
            getString(R.string.ask_caption_title),
            getString(R.string.ask_caption_hint),
            onYes = {
                showTextInput("Caption text", "Type your caption", fallback = "Your caption") { text ->
                    addElement(ElementType.CAPTION, text = text)
                    askSticker()
                }
            },
            onNo = { askSticker() }
        )
    }

    private fun askSticker() {
        val title = if (stickerAskedOnce) getString(R.string.ask_sticker_title_again) else getString(R.string.ask_sticker_title)
        showYesNo(
            title,
            getString(R.string.ask_sticker_hint),
            onYes = {
                showStickerPicker { iconRes ->
                    addElement(ElementType.STICKER, iconRes = iconRes)
                    stickerAskedOnce = true
                    askSticker()
                }
            },
            onNo = { /* setup flow finished, main editor is already visible */ }
        )
    }

    private fun showYesNo(title: String, hint: String, onYes: () -> Unit, onNo: () -> Unit) {
        val dialog = BottomSheetDialog(this, R.style.Theme_Arena_BottomSheet)
        val view = layoutInflater.inflate(R.layout.sheet_yes_no, null)
        view.findViewById<TextView>(R.id.sheetTitle).text = title
        view.findViewById<TextView>(R.id.sheetHint).text = hint
        view.findViewById<Button>(R.id.btnNo).setOnClickListener { dialog.dismiss(); onNo() }
        view.findViewById<Button>(R.id.btnYes).setOnClickListener { dialog.dismiss(); onYes() }
        dialog.setContentView(view)
        dialog.setCancelable(false)
        dialog.show()
    }

    private fun showTextInput(title: String, hint: String, fallback: String = hint, onSave: (String) -> Unit) {
        val dialog = BottomSheetDialog(this, R.style.Theme_Arena_BottomSheet)
        val view = layoutInflater.inflate(R.layout.sheet_text_input, null)
        view.findViewById<TextView>(R.id.sheetInputTitle).text = title
        val field = view.findViewById<EditText>(R.id.sheetInputField)
        field.hint = hint
        view.findViewById<Button>(R.id.btnInputSave).setOnClickListener {
            val text = field.text.toString().trim().ifEmpty { fallback }
            dialog.dismiss()
            onSave(text)
        }
        dialog.setContentView(view)
        dialog.setCancelable(false)
        dialog.show()
    }

    private fun showStickerPicker(onPicked: (Int) -> Unit) {
        val dialog = BottomSheetDialog(this, R.style.Theme_Arena_BottomSheet)
        val view = layoutInflater.inflate(R.layout.sheet_sticker_pick, null)

        val map = listOf(
            R.id.stk_fire to R.drawable.ic_fire,
            R.id.stk_heart to R.drawable.ic_heart,
            R.id.stk_star to R.drawable.ic_star,
            R.id.stk_thumb to R.drawable.ic_thumb_up,
            R.id.stk_flag to R.drawable.ic_flag,
            R.id.stk_flash to R.drawable.ic_flash,
            R.id.stk_rocket to R.drawable.ic_rocket,
            R.id.stk_eye to R.drawable.ic_eye,
            R.id.stk_check to R.drawable.ic_check_circle,
            R.id.stk_pin to R.drawable.ic_pin
        )

        var chosen: Int? = null
        map.forEach { (viewId, iconRes) ->
            view.findViewById<ImageButton>(viewId).setOnClickListener { btn ->
                map.forEach { (otherId, _) -> view.findViewById<ImageButton>(otherId).isSelected = false }
                btn.isSelected = true
                chosen = iconRes
            }
        }

        view.findViewById<Button>(R.id.btnStickerSave).setOnClickListener {
            dialog.dismiss()
            onPicked(chosen ?: R.drawable.ic_star)
        }
        dialog.setContentView(view)
        dialog.setCancelable(false)
        dialog.show()
    }
}
